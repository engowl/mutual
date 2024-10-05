import { useEffect, useReducer } from "react";
import { Button, Input, Spinner } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import Lottie from "react-lottie";
import { useMCAuth } from "../../lib/mconnect/hooks/useMcAuth.jsx";
import { mutualAPI } from "../../api/mutual.js";
import IconicButton from "../../components/ui/IconicButton";
import animationData from "../../assets/lottie-loading.json";
import { AxiosError } from "axios";

const FORM_INPUT_CHANGE = "FORM_INPUT_CHANGE";
const FORM_SUBMIT_START = "FORM_SUBMIT_START";
const FORM_SUBMIT_SUCCESS = "FORM_SUBMIT_SUCCESS";
const FORM_SUBMIT_ERROR = "FORM_SUBMIT_ERROR";

// Initial state
const initialState = {
  formData: {
    name: "",
    tw: "",
    ca: "",
    tl: "",
    group: "",
  },
  loading: false,
  error: null,
};

// Reducer function
const formReducer = (state, action) => {
  switch (action.type) {
    case FORM_INPUT_CHANGE:
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
      };
    case FORM_SUBMIT_START:
      return { ...state, loading: true, error: null };
    case FORM_SUBMIT_SUCCESS:
      return { ...state, loading: false };
    case FORM_SUBMIT_ERROR:
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
};

export default function ProjectOwnerRegisterPage() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { isLoggedIn, user, getUser, isUserLoading } = useMCAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (isLoggedIn) {
      interval = setInterval(() => {
        getUser({ silentLoad: true });
      }, 10000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [getUser, isLoggedIn]);

  useEffect(() => {
    if (user?.projectOwner?.status === "APPROVED") {
      navigate("/success");
    }
  }, [navigate, user?.projectOwner?.status]);

  const handleInputChange = (e) => {
    dispatch({
      type: FORM_INPUT_CHANGE,
      field: e.target.name,
      value: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: FORM_SUBMIT_START });
    try {
      await mutualAPI.post("/users/update", {
        projectOwner: {
          telegramAdmin: state.formData.tl,
          projectDetail: {
            projectName: state.formData.name,
            contractAddress: state.formData.ca,
            twitterLink: state.formData.tw,
            telegramGroupLink: state.formData.group,
          },
        },
      });
      dispatch({ type: FORM_SUBMIT_SUCCESS });
      await getUser();
    } catch (error) {
      console.error("Error updating role:", error);
      if (error instanceof AxiosError) {
        if (error.status === 500) {
          dispatch({ type: FORM_SUBMIT_ERROR, error: "Internal Server Error" });
        }
        if (error.status === 400) {
          dispatch({ type: FORM_SUBMIT_ERROR, error: "Bad Request" });
        }
        return;
      }
      dispatch({ type: FORM_SUBMIT_ERROR, error: error.message });
    }
  };

  if (!user || isUserLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (user?.projectOwner && user.projectOwner.status !== "APPROVED") {
    return <OnProcessBanner />;
  }

  return (
    <div className="w-full lg:h-full flex items-center justify-center lg:overflow-hidden">
      <div className="w-full flex flex-col lg:flex-row lg:h-full">
        <Banner />
        <FormContent
          formData={state.formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          loading={state.loading}
          error={state.error}
        />
      </div>
    </div>
  );
}

function Banner() {
  return (
    <div className="hidden lg:flex h-full w-[610px] overflow-hidden relative">
      <img
        src="/assets/register-page/project-owner-banner.png"
        alt="project-owner-banner"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function FormContent({
  formData,
  handleInputChange,
  handleSubmit,
  loading,
  error,
}) {
  return (
    <div className="flex-1 lg:overflow-y-auto">
      <div className="w-full max-w-3xl flex flex-col items-start px-8 py-12">
        <h1 className="text-4xl font-medium">Your Project Details</h1>
        <form
          onSubmit={handleSubmit}
          className="mt-8 w-full flex flex-col gap-7"
        >
          <FormInput
            label="Project Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter Project Name"
          />
          <FormInput
            label="Project Twitter Link"
            name="tw"
            value={formData.tw}
            onChange={handleInputChange}
            placeholder="e.g https://twitter.com/johndoe"
          />
          <FormInput
            label="Project Contract Address"
            name="ca"
            value={formData.ca}
            onChange={handleInputChange}
            placeholder="Enter contract address"
          />
          <FormInput
            label="Telegram Admin Username"
            name="tl"
            value={formData.tl}
            onChange={handleInputChange}
            placeholder="Enter admin username"
          />
          <FormInput
            label="Project Telegram Group Link"
            name="group"
            value={formData.group}
            onChange={handleInputChange}
            placeholder="Enter Group Link"
          />
          {error && <p className="text-red-500">{error}</p>}
          <div className="mt-7 w-full flex justify-end">
            <IconicButton
              type="submit"
              className="rounded-full border-orangy"
              arrowBoxClassName="rounded-full bg-orangy"
              isLoading={loading}
            >
              <p className="group-hover:text-white transition-colors text-orangy px-4">
                Continue
              </p>
            </IconicButton>
          </div>
        </form>
      </div>
    </div>
  );
}

const FormInput = ({ label, name, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1 w-full">
    <label>{label}</label>
    <Input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variant="bordered"
      classNames={{
        inputWrapper: "border rounded-lg h-12 border-black/10 shadow-none",
        input: "placeholder:opacity-50",
      }}
    />
  </div>
);

const OnProcessBanner = () => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center text-center px-5 md:px-10">
      <div className="flex flex-col items-center">
        <div className="size-[16rem] md:size-[20rem]">
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: animationData,
              rendererSettings: {
                preserveAspectRatio: "xMidYMid slice",
              },
            }}
            height="100%"
            width="100%"
            isClickToPauseDisabled
          />
        </div>
        <p className="text-2xl font-medium mt-4">
          Hang tight, we&apos;re reviewing your project! 😉
        </p>
        <p className="text-neutral-500 mt-8">Need help?</p>
        <Button
          size="lg"
          className="bg-orangy text-white mt-5 rounded-full font-medium"
        >
          Contact Admin
        </Button>
      </div>
    </div>
  );
};
