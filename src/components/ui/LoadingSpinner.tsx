export function LoadingSpinner({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-[60px_20px] text-center text-[#888]">
            <div className="h-[50px] w-[50px] animate-spin rounded-full border-4 border-[#f3f3f3] border-t-[#ff5a5f]"></div>
            <p className="mt-5 text-lg text-[#666]">{label}</p>
        </div>
    );
}
