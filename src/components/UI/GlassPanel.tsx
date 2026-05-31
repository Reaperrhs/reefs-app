
import { twMerge } from 'tailwind-merge';
import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';


interface GlassPanelProps extends HTMLMotionProps<"div"> {
    className?: string;
    children: React.ReactNode;
}

export const GlassPanel = ({ className, children, ...props }: GlassPanelProps) => {
    return (
        <motion.div
            className={twMerge(
                "backdrop-blur-md bg-white/10 border border-white/20 shadow-xl rounded-2xl overflow-hidden",
                "dark:bg-slate-900/60 dark:border-slate-700/50",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};
