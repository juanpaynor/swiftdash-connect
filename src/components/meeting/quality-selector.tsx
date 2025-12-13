import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { useCall } from '@stream-io/video-react-sdk';

export const QualitySelector = () => {
    const call = useCall();

    const handleQualityChange = async (quality: 'low' | 'standard' | 'hd') => {
        if (!call) return;

        let width, height, frameRate;

        switch (quality) {
            case 'low':
                width = 320;
                height = 180;
                frameRate = 15;
                break;
            case 'hd':
                width = 1280;
                height = 720;
                frameRate = 30;
                break;
            case 'standard':
            default:
                width = 640;
                height = 360;
                frameRate = 24;
                break;
        }

        // Apply constraints to camera
        // Note: Stream SDK specific quality setting implementation requires different handling
        await call.camera.disable();
        await call.camera.enable();
        console.log(`Switched to ${quality} settings`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
                    <Settings2 className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-black/90 border-white/20 text-white">
                <DropdownMenuItem onClick={() => handleQualityChange('hd')}>
                    High Definition (720p)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQualityChange('standard')}>
                    Standard (360p)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQualityChange('low')}>
                    Low Data (180p)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
