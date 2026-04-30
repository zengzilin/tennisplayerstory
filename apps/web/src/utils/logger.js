const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] INFO: ${message}`;
    if (data) {
      console.log(formattedMessage, data);
      return `${formattedMessage} ${JSON.stringify(data)}`;
    }
    console.log(formattedMessage);
    return formattedMessage;
  },

  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ERROR: ${message}`;
    if (error) {
      console.error(formattedMessage, error);
      return `${formattedMessage} ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
    console.error(formattedMessage);
    return formattedMessage;
  }
};

export default logger;