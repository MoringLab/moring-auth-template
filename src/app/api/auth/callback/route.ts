import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { oauthConfig } from '@/lib/oauth/config';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${error}`, process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_code_or_state', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    const codeVerifier = cookieStore.get('code_verifier')?.value;

    if (!storedState || storedState !== state) {
      console.error('[OAuth Callback] State mismatch');
      return NextResponse.redirect(
        new URL('/?error=invalid_state', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/?error=missing_code_verifier', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    console.log('[OAuth Callback] Exchanging code for tokens...');

    // Extract the client's User-Agent to pass to the upstream server
    // This helps strictly identify the client environment and prevents Cloudflare Bot Fight Mode blocking
    const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // SSO 서버에서 토큰 교환
    const tokenResponse = await axios.post(
      `${oauthConfig.ssoUrl}/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: oauthConfig.redirectUri,
        client_id: oauthConfig.clientId,
        client_secret: process.env.SSO_CLIENT_SECRET!,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Pass the real client's User-Agent strictly
          'User-Agent': userAgent,
        },
      }
    );

    const { access_token } = tokenResponse.data;
    console.log('[OAuth Callback] Got access token, fetching user info...');

    // SSO 서버에서 UserInfo 조회
    const userInfoResponse = await axios.get(`${oauthConfig.ssoUrl}/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'User-Agent': userAgent,
      },
    });

    const userInfo = userInfoResponse.data;
    console.log('[OAuth Callback] User info:', userInfo);

    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let user = existingUsers?.users.find((u) => u.email === userInfo.email);

    if (user) {
      console.log('[OAuth Callback] Updating existing user:', user.id);
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email: userInfo.email,
        email_confirm: true,
        user_metadata: {
          full_name: userInfo.name,
          avatar_url: userInfo.picture,
          preferred_username: userInfo.preferred_username,
          sso_sub: userInfo.sub,
        },
      });
    } else {
      console.log('[OAuth Callback] Creating new user...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userInfo.email,
        email_confirm: true,
        user_metadata: {
          full_name: userInfo.name,
          avatar_url: userInfo.picture,
          preferred_username: userInfo.preferred_username,
          sso_sub: userInfo.sub,
        },
      });

      if (createError || !newUser.user) {
        console.error('[OAuth Callback] Failed to create user:', createError);
        return NextResponse.redirect(
          new URL('/?error=user_creation_failed', process.env.NEXT_PUBLIC_APP_URL)
        );
      }

      user = newUser.user;
      console.log('[OAuth Callback] Created new user:', user.id);
    }

    console.log('[OAuth Callback] Creating session tokens for user:', user.id);

    // Generate a one-time password link that includes session tokens
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    });

    if (linkError || !linkData) {
      console.error('[OAuth Callback] Failed to generate link:', linkError);
      return NextResponse.redirect(
        new URL('/?error=session_creation_failed', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    console.log('[OAuth Callback] Extracting tokens from hashed_token');

    // Use the hashed_token to verify and get session
    let response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL!));

    response.cookies.delete('oauth_state');
    response.cookies.delete('code_verifier');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Verify OTP with the hashed token to create a proper session
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: linkData.properties.hashed_token,
    });

    if (sessionError || !sessionData.session) {
      console.error('[OAuth Callback] Failed to verify OTP:', sessionError);
      return NextResponse.redirect(
        new URL('/?error=session_creation_failed', process.env.NEXT_PUBLIC_APP_URL)
      );
    }

    console.log('[OAuth Callback] Session created successfully');

    console.log('[OAuth Callback] Redirecting to home page');
    return response;
  } catch (error: any) {
    console.error('[OAuth Callback Error]:', error);
    console.error('[OAuth Callback Error Details]:', error.response?.data || error.message);
    return NextResponse.redirect(
      new URL('/?error=server_error', process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}
