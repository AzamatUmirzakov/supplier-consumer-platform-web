const FormContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-8 py-10 bg-[#1a1a1a] rounded-2xl text-center">
      {children}
    </div>
  );
};

export default FormContainer;