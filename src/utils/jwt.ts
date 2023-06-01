import jwt, { SignOptions } from "jsonwebtoken";
import config from "config";
import { User } from "../models/user.model";
import { accessTokenExpiresIn, refreshTokenExpiresIn } from "../constants";
import redisClient from "./connectRedis";

export const signJwt = (
  payload: Object,
  keyName: "accessTokenPrivateKey" | "refreshTokenPrivateKey",
  options?: SignOptions
) => {
  const privateKey = Buffer.from(
    config.get<string>(keyName),
    "base64"
  ).toString("ascii");

  return jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: "RS256",
  });
};

export const verifyJwt = <T>(
  token: string,
  keyName: "accessTokenPublicKey" | "refreshTokenPublicKey"
): T | null => {
  const publicKey = Buffer.from(config.get<string>(keyName), "base64").toString(
    "ascii"
  );

  try {
    return jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    }) as T;
  } catch (error) {
    return null;
  }
};

// Sign JWT Tokens
export function signTokens(user: User) {
  const userId: string = user._id.toString();

  const access_token = signJwt({ userId }, "accessTokenPrivateKey", {
    expiresIn: `${accessTokenExpiresIn}m`,
  });

  const refresh_token = signJwt({ userId }, "refreshTokenPrivateKey", {
    expiresIn: `${refreshTokenExpiresIn}m`,
  });

  redisClient.set(userId, JSON.stringify(user), {
    EX: refreshTokenExpiresIn * 60,
  });

  return { access_token, refresh_token };
}
