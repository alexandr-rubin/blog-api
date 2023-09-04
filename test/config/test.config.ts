export const getTestConfiguration = () => ({
    db: {
      mongo: {
        mongodb_uri: 'mongodb://127.0.0.1:27017/testDB',
      }
    },
  });
  
  type TestConfigurationType = ReturnType<typeof getTestConfiguration>;
  
  export type TestConfigType = TestConfigurationType & {
    MONGODB_URI: string;
  };