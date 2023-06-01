import {
  AuthenticationError,
  ForbiddenError,
  ValidationError,
} from "apollo-server-core";
import config from "config";
import { CookieOptions } from "express";
import deserializeUser from "../middleware/deserializeUser";
import UserModel, { User } from "../models/user.model";
import { LoginInput } from "../schemas/user.schema";
import redisClient from "../utils/connectRedis";
import { signJwt, signTokens, verifyJwt } from "../utils/jwt";
import errorHandler from "../utils/errorHandler";
import { Context } from "../types/context";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../utils/cookie";

export default class UserService {
  // Register User
  async signUpUser(signUpInput: Partial<User>) {
    try {
      const user = await UserModel.create(signUpInput);
      return {
        status: "success",
        user,
      };
    } catch (error: any) {
      if (error.code === 11000)
        return new ValidationError("Email already exists");
      errorHandler(error);
    }
  }

  // Login User
  async loginUser(loginInput: LoginInput, { res }: Context) {
    try {
      const message = "Invalid email or password";

      const user = await UserModel.findByEmail(loginInput.email);

      if (!user) {
        return new AuthenticationError(message);
      }

      if (
        !(await UserModel.comparePasswords(user.password, loginInput.password))
      ) {
        return new AuthenticationError(message);
      }

      const { access_token, refresh_token } = signTokens(user);

      res.cookie("access_token", access_token, accessTokenCookieOptions);
      res.cookie("refresh_token", refresh_token, refreshTokenCookieOptions);
      res.cookie("logged_in", "true", {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });

      return {
        status: "success",
        access_token,
      };
    } catch (error: any) {
      errorHandler(error);
    }
  }

  async getMe({ req, res, deserializeUser }: Context) {
    try {
      const user = await deserializeUser(req);
      return {
        status: "success",
        user,
      };
    } catch (error: any) {
      errorHandler(error);
    }
  }

  async refreshAccessToken({ req, res }: Context) {
    try {
      // Get the refresh token
      const { refresh_token } = req.cookies;

      // Validate the RefreshToken
      const decoded = verifyJwt<{ userId: string }>(
        refresh_token,
        "refreshTokenPublicKey"
      );

      if (!decoded) {
        throw new ForbiddenError("Could not refresh access token");
      }

      // Check if user's session is valid
      const session = await redisClient.get(decoded.userId);

      if (!session) {
        throw new ForbiddenError("User session has expired");
      }

      // Check if user exist and is verified
      const user = await UserModel.findById(JSON.parse(session)._id).select(
        "+verified"
      );

      if (!user || !user.verified) {
        throw new ForbiddenError("Could not refresh access token");
      }

      const { access_token, refresh_token: new_refresh_token } =
        signTokens(user);

      res.cookie("access_token", access_token, accessTokenCookieOptions);
      res.cookie("refresh_token", new_refresh_token, refreshTokenCookieOptions);
      res.cookie("logged_in", "true", {
        ...accessTokenCookieOptions,
        httpOnly: false,
      });

      return {
        status: "success",
        access_token,
      };
    } catch (error) {
      errorHandler(error);
    }
  }

  async logoutUser({ req, res }: Context) {
    try {
      const user = await deserializeUser(req);

      // Delete the user's session
      await redisClient.del(String(user?._id));

      // Logout user
      res.cookie("access_token", "", { maxAge: -1 });
      res.cookie("refresh_token", "", { maxAge: -1 });
      res.cookie("logged_in", "", { maxAge: -1 });

      return true;
    } catch (error) {
      errorHandler(error);
    }
  }
}
