export const successResponse = (message, data = null) => {
  return {
    status: 0,
    message,
    data,
  };
};

export const errorResponse = (status, message, data = null) => {
  return {
    status,
    message,
    data,
  };
};
