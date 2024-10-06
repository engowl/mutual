import jwt from "jsonwebtoken";

export const authMiddleware = async (request, reply) => {
  try {
    let authHeaderToken = request.headers.authorization;

    if (!authHeaderToken) {
      return reply
        .status(401)
        .send({ message: "Please provide Authorization key" });
    }

    // Remove Bearer from token
    if (authHeaderToken.startsWith("Bearer ")) {
      authHeaderToken = authHeaderToken.slice(7, authHeaderToken.length);
    }

    if (!authHeaderToken) {
      return reply.status(401).send({ message: "Please provide Bearer token" });
    }

    // console.log("authHeaderToken", authHeaderToken);

    const decodedToken = jwt.verify(authHeaderToken, process.env.JWT_SECRET);

    if (!decodedToken) {
      return reply.status(401).send({
        message: "Unauthorized access",
      });
    }

    request.user = decodedToken;

    return true;
  } catch (error) {
    console.log("Error verifying message: ", error);
    return reply
      .status(400)
      .send({ message: "Invalid message, token or signature" });
  }
};
