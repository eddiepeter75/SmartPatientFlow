export default function Footer() {
  return (
    <footer className="bg-white border-t border-secondary-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-secondary-500">
            <span>© {new Date().getFullYear()} Hospital Queue Management System</span>
          </div>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <span className="text-sm text-secondary-500">
              Last updated: <span>{new Date().toLocaleTimeString()}</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
