export function LoadingSpinner({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-[60px_20px] text-center text-muted-foreground">
            <div className="h-[50px] w-[50px] animate-spin rounded-full border-4 border-border border-t-primary"></div>
            <p className="mt-5 text-lg text-muted-foreground">{label}</p>
        </div>
    );
}
