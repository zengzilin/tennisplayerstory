import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Admin route protection
  if (pathname.includes("/admin")) {
    const isAdmin = (req.auth?.user as { role?: string } | undefined)?.role === "admin";
    if (!isAdmin) {
      const redirectUrl = new URL(`/${routing.defaultLocale}/login`, req.url);
      redirectUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(redirectUrl);
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
