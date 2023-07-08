import dynamic from "next/dynamic";

const GetLicense = dynamic(
  import("../../components/dynamic-required/GetLicense"),
  { ssr: false }
); // Async API cannot be server-side rendered

const GetLicenseWrap = () => {
  return <GetLicense />;
};

export default GetLicenseWrap;
