// import { StripeProvider } from "@stripe/stripe-react-native";

// export default function StripeProviderComponent(
//   props: Omit<
//     React.ComponentProps<typeof StripeProvider>,
//     "publishableKey" | "urlScheme"
//   >,
// ) {
//   let key = "";

//   const useTestKey = process.env.EXPO_PUBLIC_USE_TEST_PAYMENTS === "true";

//   if (useTestKey) {
//     key =
//       "xxxxxxxxxxx";
//   } else {
//     key =
//       "xxxxxxxxxxx";
//   }

//   return (
//     <StripeProvider
//       publishableKey={key}
//       urlScheme="sumirebuild" // required for 3D Secure and bank redirects
//       {...props}
//     />
//   );
// }
