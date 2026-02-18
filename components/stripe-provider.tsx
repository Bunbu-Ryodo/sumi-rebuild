import { StripeProvider } from "@stripe/stripe-react-native";

export default function StripeProviderComponent(
  props: Omit<
    React.ComponentProps<typeof StripeProvider>,
    "publishableKey" | "urlScheme"
  >,
) {
  let key = "";

  const useTestKey = __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_ADS === "true";

  if (useTestKey) {
    key =
      "pk_test_51RaGupQZ7SqqoiIZzmmmBAc5PVihFmt7WpBvFjDj6W2YRZs6HN18i8uEXDtTsosa5eceA4d5MIqdR60RHtoVArsa001oNfkQM5";
  } else {
    key =
      "pk_live_51RaGuhHlG5ThNA8k7Bhk5mWqUFbVOtUp1XBBz4thuM2FXcQ51EvAtKLkayQjen9IPAyeK2uuuK8JXgyjuYVRy8J000Gn0SLTW2";
  }

  return (
    <StripeProvider
      publishableKey={
        "pk_test_51RaGupQZ7SqqoiIZzmmmBAc5PVihFmt7WpBvFjDj6W2YRZs6HN18i8uEXDtTsosa5eceA4d5MIqdR60RHtoVArsa001oNfkQM5"
      }
      urlScheme="sumirebuild://" // required for 3D Secure and bank redirects
      {...props}
    />
  );
}
