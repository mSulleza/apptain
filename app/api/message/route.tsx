import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { options } from "../auth/[...nextauth]/option";

const prisma = new PrismaClient()
export async function POST(request: NextRequest) {
    const session = await getServerSession(options)

    if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 403 })
    
    const data = await request.json()

    const res = await prisma.message.create({
        data: {
            messageId: data.messageId.toString(),
            message: data.message,
            senderIdentifier: data.senderIdentifier,
            receiverIdentifier: data.receiverIdentifier,
            channelUrl: data.channelUrl,
            sentAt: new Date(data.sentAt),
            type: data.type
        }
    })

    return NextResponse.json(res)
}

export async function PATCH(request: NextRequest) {
    const data = await request.json()
    
    const updateData = {}

    if (data.senderIdentifier) updateData["senderIdentifier"] = data.senderIdentifier
    if (data.receiverIdentifier) updateData["receiverIdentifier"] = data.receiverIdentifier
    if (data.channelUrl) updateData["channelUrl"] = data.channelUrl
    if (data.sentAt) updateData["sentAt"] = data.sentAt
    if (data.type) updateData["type"] = data.type
    if (data.deleted) updateData["deleted"] = data.deleted
    if (data.message) updateData["message"] = data.message
    
    const channel = await prisma.message.update({
        where: {
            messageId: data.messageId.toString(),
        },
        data: updateData
    })

    return NextResponse.json(channel)
}