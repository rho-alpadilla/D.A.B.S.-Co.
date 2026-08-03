import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

// Design A — Artisan Canvas button variants.
// default   → artisan purple gradient (replaces shadcn blue primary)
// outline   → purple border + hover fill (replaces gray border)
// secondary → lavender wash (replaces light gray)
// ghost     → purple hover wash
// link      → purple underline
// destructive → unchanged (red — correct for error actions)
const buttonVariants = cva(
	'inline-flex max-w-full shrink-0 items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-[transform,box-shadow,background-color,border-color,color,filter] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary/60 focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none',
	{
		variants: {
			variant: {
				// Deep violet → lavender purple gradient
				default:
				  'bg-artisan-primary text-white shadow-artisan-sm hover:bg-[#4A247B] hover:shadow-artisan-md',
				// Red — intentionally unchanged for destructive actions
				destructive:
				  'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				// Purple border, fills on hover
				outline:
				  'border border-artisan-primary-light bg-transparent text-artisan-primary hover:bg-artisan-primary-wash hover:border-artisan-primary',
				// Lavender wash, soft purple text
				secondary:
				  'bg-artisan-primary-wash text-artisan-primary-mid hover:bg-artisan-primary-pale/40',
				// Transparent, purple hover
				ghost:
				  'hover:bg-artisan-primary-wash hover:text-artisan-primary',
				// Underline link
				link:
				  'text-artisan-primary underline-offset-4 hover:underline',
			},
			shape: {
				default: 'rounded-xl',
				pill: 'rounded-full',
				square: 'rounded-lg',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 px-3.5',
				lg: 'h-11 px-8',
				icon: 'h-10 w-10 rounded-full',
			},
		},
		defaultVariants: {
			variant: 'default',
			shape: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };
