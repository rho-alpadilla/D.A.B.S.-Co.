import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

const Tabs = TabsPrimitive.Root

// Design A — Artisan Canvas reskin.
// Tab list background: slate-100 → artisan lavender wash
// Active tab: white bg + artisan-text + purple shadow
// Focus ring: slate-950 → artisan-primary
const tabsListVariants = cva(
  "inline-flex min-h-11 items-center justify-center border border-artisan-primary/10 bg-white/70 p-1 text-artisan-text-muted shadow-sm backdrop-blur-sm",
  {
    variants: {
      variant: {
        segmented: "rounded-xl",
        underline: "min-h-0 rounded-none border-x-0 border-t-0 bg-transparent p-0 shadow-none backdrop-blur-none",
        filter: "rounded-xl",
      },
    },
    defaultVariants: { variant: "segmented" },
  }
)

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap px-3.5 py-2 text-sm font-semibold ring-offset-white transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary/40 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none",
  {
    variants: {
      variant: {
        segmented: "rounded-lg data-[state=active]:bg-artisan-primary data-[state=active]:text-white data-[state=active]:shadow-artisan-sm",
        underline: "rounded-none border-b-2 border-transparent text-artisan-text-muted data-[state=active]:border-artisan-primary data-[state=active]:bg-transparent data-[state=active]:text-artisan-primary",
        filter: "rounded-lg border border-artisan-primary/12 bg-white/85 text-artisan-text-mid shadow-sm hover:border-artisan-primary data-[state=active]:border-artisan-primary data-[state=active]:bg-artisan-primary data-[state=active]:text-white data-[state=active]:shadow-artisan-sm",
      },
    },
    defaultVariants: { variant: "segmented" },
  }
)

const TabsList = React.forwardRef(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary/40 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants }
