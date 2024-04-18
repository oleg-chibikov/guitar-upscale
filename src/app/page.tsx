import { Main } from "./components/Main";
import ServerActionRoot from "./components/ServerActionRoot";
import { ContextProvider } from "./context/ContextProvider";

const Home: React.FC = async () => {
  return (
    <ServerActionRoot
      renderChildren={(s) => (
        <ContextProvider premiumFeaturesWithSession={s}>
          <Main />
        </ContextProvider>
      )}
    ></ServerActionRoot>
  );
};

export default Home;
