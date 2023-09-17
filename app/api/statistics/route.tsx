import { PrismaClient } from "@prisma/client";
import { addDays, addHours, addMonths, eachDayOfInterval, eachHourOfInterval, eachMonthOfInterval, getHours } from "date-fns";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { options } from "../auth/[...nextauth]/option";

export async function POST(request: NextRequest) {

    const session = await getServerSession(options)

    if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 403 })
    const params = await request.json()

    const prisma = new PrismaClient()

    const data = {}

    const requestStart = new Date(params.startDate)
    const requestEnd = new Date(params.endDate)

    data["interval_start"] = requestStart
    data["interval_end"] = requestEnd

    const constraint = {
        createdAt: 
        {
            gte: requestStart,
            lte: requestEnd
        }
    }

    if (params.userId) constraint["createdBy"] = params.userId

    // channel data
    const res = await prisma.channel.findMany({
        where: constraint
    })
    
    if (params.requestType === "hourly") {
        data["interval"] = "hourly"

        // loop through each hour
        const hourlyInterval = eachHourOfInterval({start: requestStart, end: requestEnd})
        const dataGroup = hourlyInterval.map((time) => {
            const nextHour = addHours(time, 1)
            const filteredData = res.filter((e) => {
                const currentDate = new Date(e.createdAt)
                if (currentDate >= time && currentDate <= nextHour) return e
            })

            let totalMessages = 0
            filteredData.forEach((d) => totalMessages += d.messageTotal)
            const data = {
                "timestamp": time,
                "messages_sent": totalMessages,
                "channels_created": filteredData.length
            }

            return data
        })

        data["data"] = dataGroup
        return NextResponse.json(data)
    } else if (params.requestType === "daily") {
        data["interval"] = "daily"

        const dailyInterval = eachDayOfInterval({start: requestStart, end: requestEnd})
        const dataGroup = dailyInterval.map((day) => {
            const nextDay = addDays(day, 1)
            const filteredData = res.filter((e) => {
                const currentDate = new Date(e.createdAt)
                if (currentDate >= day && currentDate <= nextDay) return e
            })

            let totalMessages = 0
            filteredData.forEach((d) => totalMessages += d.messageTotal)
            const data = {
                "timestamp": day,
                "messages_sent": totalMessages,
                "channels_created": filteredData.length
            }

            return data
        })

        data["data"] = dataGroup
        return NextResponse.json(data)
    } else if (params.requestType === "monthly") {
        data["interval"] = "monthly"

        const monthlyInterval = eachMonthOfInterval({start: requestStart, end: requestEnd})
        const dataGroup = monthlyInterval.map((month) => {
            const nextMonth = addMonths(month, 1)
            const filteredData = res.filter((e) => {
                const currentDate = new Date(e.createdAt)
                if (currentDate >= month && currentDate <= nextMonth) return e
            })

            let totalMessages = 0
            filteredData.forEach((d) => totalMessages += d.messageTotal)
            const data = {
                "timestamp": month,
                "messages_sent": totalMessages,
                "channels_created": filteredData.length
            }

            return data
        })

        data["data"] = dataGroup
        return NextResponse.json(data)
    }
}