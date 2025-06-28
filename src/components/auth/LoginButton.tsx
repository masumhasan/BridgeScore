"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function LoginButton() {
    return (
        <Link href="/login" passHref>
            <Button>
                <LogIn className="mr-2 h-4 w-4" />
                Login
            </Button>
        </Link>
    );
}
