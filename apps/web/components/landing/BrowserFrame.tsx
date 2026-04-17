interface Props {
    children: React.ReactNode;
    url?: string;
}

export function BrowserFrame({ children, url = "devinbox.mydevdeck.com" }: Props) {
    return (
        <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5 bg-white">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                    <div className="px-3 py-1 bg-white rounded text-xs text-gray-500 text-center max-w-sm mx-auto">
                        {url}
                    </div>
                </div>
            </div>
            <div>{children}</div>
        </div>
    );
}
