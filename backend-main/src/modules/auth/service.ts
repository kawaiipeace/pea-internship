import crypto from "crypto";
import { and, desc, eq } from "drizzle-orm";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
} from "@/common/exceptions";
import { db } from "@/db";
import { accounts, passwordResetTokens, studentProfiles, users } from "@/db/schema";
import { type Auth, auth } from "@/lib/auth";
import type * as model from "./model";
import { sendResetPasswordCodeEmail } from "@/modules/mail/service";

const ROLE_INTERN = 3;

export class AuthService {
  async registerIntern(data: model.RegisterInternBodyType) {
    const authResponse = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.fname,
        fname: data.fname,
        lname: data.lname,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        roleId: ROLE_INTERN,
        departmentId: null,
        username: data.phoneNumber,
        displayUsername: `${data.fname} ${data.lname}`,
      },
    });

    if (!authResponse?.user) {
      throw new InternalServerError("Failed to create user account.");
    }

    const userId = authResponse.user.id;

    try {
      return await db.transaction(async (tx) => {
        await tx.insert(studentProfiles).values({
          userId: userId,
          institutionId: data.institutionId,
          faculty: data.faculty ?? null,
          major: data.major,
          studentNote: data.studentNote ?? null,
          internshipStatus: "IDLE",
          isActive: true,
        });

        return { success: true, message: "Intern registration successful" };
      });
    } catch (error) {
      console.error(
        "Profile creation failed. Rolling back user:",
        userId,
        error
      );

      try {
        await db.delete(users).where(eq(users.id, userId));
      } catch (rollbackError) {
        console.error(
          `FATAL: Orphan user created! ID: ${userId}`,
          rollbackError
        );
      }

      throw new BadRequestError(
        "Failed to create student profile. The account creation has been rolled back. Please verify your information and try again."
      );
    }
  }

  async login(data: model.LoginInternBodyType) {
    const response = await auth.api.signInUsername({
      body: {
        username: data.phoneNumber,
        password: data.password,
      },
      asResponse: true,
    });

    if (!response) {
      throw new InternalServerError(
        "Login failed: No response from auth provider"
      );
    }

    if (!response.ok) {
      throw new BadRequestError("Invalid phone number or password");
    }

    return response;
  }

  async login_itt(data: model.LoginInternBodyType) {
    const response = await auth.api.signInUsername({
      body: {
        username: data.phoneNumber,
        password: data.password,
      },
      asResponse: true,
    });

    if (!response || !response.ok) {
      throw new BadRequestError("Invalid phone number or password");
    }

    const authData = await response.clone().json();
    const userId = authData.user.id;

    const studentProfile = await db
      .select({
        internshipStatus: studentProfiles.internshipStatus,
      })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    const profile = studentProfile[0];

    if (!profile || profile.internshipStatus !== "ACTIVE") {
      throw new ForbiddenError(
        "การเข้าสู่ระบบถูกปฏิเสธ: สถานะการฝึกงานของคุณต้องเป็น ACTIVE เท่านั้น"
      );
    }

    return response;
  }

  async logout(headers: Headers) {
    const response = await auth.api.signOut({
      headers: headers,
      asResponse: true,
    });

    return response;
  }

  async requestResetPassword(data: model.RequestResetPasswordBodyType) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        phoneNumber: users.phoneNumber,
      })
      .from(users)
      .where(
        and(
          eq(users.email, data.email),
          eq(users.phoneNumber, data.phoneNumber)
        )
      )
      .limit(1);

    if (!user || !user.email) {
      throw new BadRequestError("ไม่พบบัญชีผู้ใช้จากเบอร์โทรศัพท์และอีเมลนี้");
    }

    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.userId, user.id));

    const code = crypto.randomInt(100000, 1000000).toString();

    const tokenHash = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
    });

    await sendResetPasswordCodeEmail(user.email, code);

    return {
      success: true,
      message: "ส่งรหัสยืนยันไปยังอีเมลเรียบร้อยแล้ว",
    };
  }

  async verifyResetCode(data: model.VerifyResetCodeBodyType) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        phoneNumber: users.phoneNumber,
      })
      .from(users)
      .where(
        and(
          eq(users.email, data.email),
          eq(users.phoneNumber, data.phoneNumber)
        )
      )
      .limit(1);

    if (!user) {
      throw new BadRequestError("ไม่พบบัญชีผู้ใช้จากเบอร์โทรศัพท์และอีเมลนี้");
    }

    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          eq(passwordResetTokens.used, false)
        )
      )
      .orderBy(desc(passwordResetTokens.createdAt))
      .limit(1);

    if (!token) {
      throw new BadRequestError("ไม่พบรหัสยืนยัน หรือรหัสถูกใช้งานไปแล้ว");
    }

    if (token.expiresAt < new Date()) {
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, token.id));

      throw new BadRequestError("รหัสยืนยันหมดอายุแล้ว กรุณาขอรหัสใหม่");
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(data.code)
      .digest("hex");

    if (codeHash !== token.tokenHash) {
      throw new BadRequestError("รหัสยืนยันไม่ถูกต้อง");
    }

    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, token.id));

    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: resetTokenHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
    });

    return {
      success: true,
      message: "ยืนยันรหัสสำเร็จ",
      resetToken,
    };
  }

  async resetPassword(data: model.ResetPasswordBodyType) {
    if (data.password !== data.confirmPassword) {
      throw new BadRequestError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(data.resetToken)
      .digest("hex");

    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, resetTokenHash),
          eq(passwordResetTokens.used, false)
        )
      )
      .limit(1);

    if (!token) {
      throw new BadRequestError("Reset token ไม่ถูกต้อง หรือถูกใช้งานไปแล้ว");
    }

    if (token.expiresAt < new Date()) {
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, token.id));

      throw new BadRequestError("Reset token หมดอายุแล้ว กรุณาขอรหัสใหม่");
    }

    const ctx = await auth.$context;
    const hashedPassword = await ctx.password.hash(data.password);

    const [updatedAccount] = await db
      .update(accounts)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(accounts.userId, token.userId),
          eq(accounts.providerId, "credential")
        )
      )
      .returning();

    if (!updatedAccount) {
      throw new BadRequestError("ไม่พบบัญชีสำหรับเปลี่ยนรหัสผ่าน");
    }

    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, token.id));

    return {
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    };
  }

  async loginWithKeycloak(headers: Headers) {
    const api = auth.api as Auth["api"];
    const callbackURL =
      Bun.env.KEYCLOAK_CALLBACK_URL ??
      "http://localhost:2700/login/owner/callback";

    return await api.signInSocial({
      headers: headers,
      body: {
        provider: "keycloak",
        callbackURL,
      },
      asResponse: true,
    });
  }
  async loginWithKeycloakiTT(headers: Headers) {
    const api = auth.api as Auth["api"];
    const callbackURL = Bun.env.iTT_KEYCLOAK_CALLBACK_URL;

    return await api.signInSocial({
      headers: headers,
      body: {
        provider: "keycloak",
        callbackURL,
      },
      asResponse: true,
    });
  }
}
