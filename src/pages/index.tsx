import dynamic from "next/dynamic";

const Home = dynamic(import("../components/dynamic-required/Home"), {
  ssr: false,
}); // Async API cannot be server-side rendered

const HomeWrap = () => {
  return <Home />;
};

export default HomeWrap;
