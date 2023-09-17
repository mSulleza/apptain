"use client";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css"
import { SendBirdProvider } from "@sendbird/uikit-react";
import "@sendbird/uikit-react/dist/index.css";
import { useCallback, useState } from "react";
import { CustomChannelList } from "./components/CustomChannelList";
import { ChannelListProvider, useChannelListContext } from "@sendbird/uikit-react/ChannelList/context";
import { GroupChannel } from "@sendbird/chat/groupChannel";
import { CustomGroupChannel } from "./components/CustomGroupChannel";
import { ChannelProvider } from "@sendbird/uikit-react/Channel/context";
import { useSession, signIn } from "next-auth/react"

export default function Page() {
  const [channel, setChannel] = useState<GroupChannel>(null);
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className={"container"}>
        <p>Hang on there...</p>
      </div>
    )
  }

  if (status === "authenticated") {
    return (    
      <SendBirdProvider userId={process.env.NEXT_PUBLIC_USER_ID} appId={process.env.NEXT_PUBLIC_APP_ID}>
        <ChannelListProvider>
        <div className={"container-fluid"} style={{ width: "100vw"}}>
          <div className={"row"}>
            <div className={"col"}>
              <CustomChannelList selectedChannel={channel} setSelectedChannel={setChannel} />
            </div>
            <div className={"col"}>
                <ChannelProvider channelUrl={channel?.url}>
                  <CustomGroupChannel currentChannel={channel} />
                </ChannelProvider>
            </div>
          </div>
        </div>
        </ChannelListProvider>
      </SendBirdProvider>
    )
  }

  return (
    <div className={"container-fluid"}>
      <p>Not signed in.</p>
      <button className={"btn btn-light"} onClick={() => signIn("github")}>Sign in</button>
    </div>
  )
}