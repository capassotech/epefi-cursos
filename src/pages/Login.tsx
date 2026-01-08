import AuthFormController from "../components/AuthForm/AuthFormController";
import EnvironmentBanner from "../components/EnvironmentBanner";

const Login = () => {
  return (
    <>
      <EnvironmentBanner />
      <AuthFormController isLogin={true} />
    </>
  );
};

export default Login;
