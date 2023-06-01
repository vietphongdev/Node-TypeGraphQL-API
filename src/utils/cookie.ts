import { CookieOptions } from "express";
import { accessTokenExpiresIn, refreshTokenExpiresIn } from "../constants";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  // domain: 'localhost',
  sameSite: "none",
  secure: true,
};

export const accessTokenCookieOptions = {
  ...cookieOptions,
  maxAge: accessTokenExpiresIn * 60 * 1000,
  expires: new Date(Date.now() + accessTokenExpiresIn * 60 * 1000),
};

export const refreshTokenCookieOptions = {
  ...cookieOptions,
  maxAge: refreshTokenExpiresIn * 60 * 1000,
  expires: new Date(Date.now() + refreshTokenExpiresIn * 60 * 1000),
};
