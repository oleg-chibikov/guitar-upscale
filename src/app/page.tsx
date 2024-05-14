import { PremiumComponentsLoader } from "./components/PremiumComponentsLoader";
import ServerActionRoot from "./components/ServerActionRoot";
import { ContextProvider } from "./context/ContextProvider";

const Home: React.FC = async () => {
  return (
    <ServerActionRoot
      renderChildren={(premiumFeaturesWithSession) => (
        <ContextProvider premiumFeatures={premiumFeaturesWithSession}>
          <PremiumComponentsLoader
            premiumFeatures={premiumFeaturesWithSession.premiumFeatures}
          />
        </ContextProvider>
      )}
    ></ServerActionRoot>
  );
};

export default Home;
