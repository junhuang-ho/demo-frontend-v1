import dynamic from "next/dynamic";

const CreateRaffle = dynamic(
  import("../../components/dynamic-required/CreateRaffle"),
  { ssr: false }
); // Async API cannot be server-side rendered

const CreateRaffleWrap = () => {
  return <CreateRaffle />;
};

export default CreateRaffleWrap;
