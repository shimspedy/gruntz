// shadcn/ui Button, restyled to the Gruntz tokens (pill, Archivo, one accent).
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold select-none ' +
    'transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] ' +
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-hi',
        bone: 'bg-bone text-ink hover:bg-bone/85',
        // Always a dark button (used on the light paper sections), so its text stays light in both themes.
        coal: 'bg-coal text-[#eef0e8] hover:bg-coal-2',
        outline: 'border border-bone/20 text-bone hover:border-bone/40 hover:bg-bone/5',
        ghost: 'text-bone-2 hover:text-bone',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-[15px]',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
