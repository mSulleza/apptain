import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { options } from "../auth/[...nextauth]/option";

const prisma = new PrismaClient()
export async function POST(request: NextRequest) {

    const session = await getServerSession(options)

    if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 403 })
    
    const data = await request.json()

    const channel = await prisma.channel.create({
        data: {
            url: data.url,
            createdBy: data.createdBy,
            chatmateIdentifier: data.chatmateIdentifier,
            messageTotal: 0,
            createdAt: new Date(data.createdAt)
        }
    })

    return NextResponse.json(channel)
}

export async function PATCH(request: NextRequest) {
    const data = await request.json()
    
    const updateData = {}

    if (data.createdBy) updateData["createdBy"] = data.createdBy
    if (data.chatmateIdentifier) updateData["chatmateIdentifier"] = data.chatmateIdentifier
    if (data.messageTotal) updateData["messageTotal"] = data.messageTotal
    if (data.deleted) updateData["deleted"] = data.deleted
    
    const channel = await prisma.channel.update({
        where: {
            url: data.url,
        },
        data: updateData
    })

    return NextResponse.json(channel)
}