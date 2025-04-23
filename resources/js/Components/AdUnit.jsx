import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const AdUnit = ({ adSlot, adFormat = 'auto', style = {} }) => {
    const adRef = useRef(null);

    useEffect(() => {
        // Only load ads in production
        if (process.env.NODE_ENV === 'production' && adRef.current) {
            try {
                // Push the ad only if window.adsbygoogle exists
                if (window.adsbygoogle) {
                    window.adsbygoogle.push({});
                }
            } catch (error) {
                console.error('Error loading ad:', error);
            }
        }
    }, []);

    // Don't render ads in development
    if (process.env.NODE_ENV !== 'production') {
        return null;
    }

    return (
        <div style={{ display: 'block', textAlign: 'center', ...style }}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-1817439438017045"
                data-ad-slot={adSlot}
                data-ad-format={adFormat}
                data-full-width-responsive="true"
            />
        </div>
    );
};

export default AdUnit; 