import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth, username } from "better-auth/plugins";
import { eq, type InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

type user = InferSelectModel<typeof schema.users>;
type session = InferSelectModel<typeof schema.sessions>;

const tempStaffData = new Map<string, string>();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  plugins: [
    username(),
    genericOAuth({
      config: [
        {
          providerId: "keycloak",
          clientId: Bun.env.KEYCLOAK_CLIENT_ID!,
          clientSecret: Bun.env.KEYCLOAK_CLIENT_SECRET,
          discoveryUrl: Bun.env.KEYCLOAK_DISCOVERY_URL,

          scopes: [
            "openid",
            "phone",
            "roles",
            "acr",
            "offline_access",
            "web-origins",
            "microprofile-jwt",
            "address",
            "profile",
            "basic",
            "service_account",
            "email",
          ],
          mapProfileToUser: async (profile) => {
            const employeeId =
              profile.employee_id || profile.preferred_username;

            if (employeeId && profile.email) {
              tempStaffData.set(profile.email, employeeId);
            }


            return {
              roleId: 2,
              departmentId: null,
              fname: profile.given_name.split(" ")[0],
              lname: profile.given_name.split(" ")[1],
              emailVerified: profile.email_verified || false,
              gender: "OTHER",
              username:
                profile.preferred_username || profile.email?.split("@")[0],
              displayUsername: profile.given_name,
              phoneNumber: profile.phone_number || null,
            };
          },
        },
      ],
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const employeeId = tempStaffData.get(user.email);

          if (employeeId) {
            try {
              // create staff_profile
              await db.insert(schema.staffProfiles).values({
                userId: user.id,
                employeeId: employeeId,
              });

              // หา dept_sap จาก employee_id_dept_sap
              const [mapping] = await db
                .select({
                  deptSap: schema.employeeIdDeptSap.deptSap,
                })
                .from(schema.employeeIdDeptSap)
                .where(eq(schema.employeeIdDeptSap.employeeId, employeeId));

              // ถ้าเจอ dept_sap ให้ update users.department_id
              if (mapping?.deptSap) {
                await db
                  .update(schema.users)
                  .set({
                    departmentId: mapping.deptSap,
                  })
                  .where(eq(schema.users.id, user.id));
              }
            } catch (error) {
              console.error("Failed to sync employee department:", error);
            } finally {
              tempStaffData.delete(user.email);
            }
          }
        },
      },
    },
  },

  user: {
    additionalFields: {
      roleId: { type: "number", required: true },
      departmentId: { type: "number", required: false },
      fname: { type: "string" },
      lname: { type: "string" },
      phoneNumber: { type: "string" },
      gender: { type: "string" },
    },
    fields: {
      name: "fname",
      image: undefined,
      username: "phoneNumber",
      emailVerified: undefined,
    },
  },

  callbacks: {
    session: async ({ session, user }: { session: session; user: user }) => {
      return {
        session,
        user,
      };
    },
  },

  advanced: {
    cookiePrefix: "better-auth",
    // Explicitly disable __Secure- prefix so cookie name stays "better-auth.session_token"
    // regardless of whether baseURL is http or https.
    // Cookies are same-origin when proxied through Next.js rewrites.
    useSecureCookies: false,
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },

  baseURL: Bun.env.BETTER_AUTH_BASE_URL,
  secret: Bun.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:2700",
    "http://localhost:2701",
    "http://127.0.0.1:2701",
    "http://localhost:2702",
    "http://127.0.0.1:2702",
    "https://pea-internship-main.vercel.app",
    "https://pea-internship-itt.vercel.app",
    ...(Bun.env.BETTER_AUTH_BASE_URL ? [Bun.env.BETTER_AUTH_BASE_URL] : []),
    // Extra trusted origins from env (comma-separated) - use this for K8s/PEA domain
    ...(Bun.env.ALLOWED_ORIGINS
      ? Bun.env.ALLOWED_ORIGINS.split(",")
          .map((o) => o.trim())
          .filter(Boolean)
      : []),
  ],
});

export type Auth = typeof auth;
