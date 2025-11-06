import FormContainer from "./components/FormContainer";
import Link from "next/link";

function AuthPage() {
  return (
    <FormContainer>
      <h1 className="text-2xl font-bold mb-2">Login</h1>
      <form className="space-y-6">
        <div className="mt-1">
          <input
            id="email"
            name="email"
            placeholder="Email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
          />
        </div>

        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-gray-500 px-3 py-2 focus:border-gray-300 focus:outline-none sm:text-sm"
          />
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-100 cursor-pointer"
          >
            Sign in
          </button>
        </div>
        <div>
          <Link href="/auth/register" className="text-sm text-white hover:underline">
            Register
          </Link>
        </div>
      </form>
    </FormContainer>
  );
}

export default AuthPage;