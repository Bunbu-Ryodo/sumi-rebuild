import { StripeProvider } from "@stripe/stripe-react-native";

export default function StripeProviderComponent(
  props: Omit<
    React.ComponentProps<typeof StripeProvider>,
    "publishableKey" | "urlScheme"
  >,
) {
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
