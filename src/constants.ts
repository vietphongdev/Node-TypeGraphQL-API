import config from "config";

// Cookie Options
export const accessTokenExpiresIn = config.get<number>("accessTokenExpiresIn");
export const refreshTokenExpiresIn = config.get<number>(
  "refreshTokenExpiresIn"
);
