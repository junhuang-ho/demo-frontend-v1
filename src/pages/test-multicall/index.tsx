import dynamic from "next/dynamic";

const TestMulticall = dynamic(
  import("../../components/dynamic-required/TestMulticall"),
  { ssr: false }
); // Async API cannot be server-side rendered

const TestMulticallWrap = () => {
  return <TestMulticall />;
};

export default TestMulticallWrap;
