import { GroupChannel } from "@sendbird/chat/groupChannel";
import { sendbirdSelectors, useSendbirdStateContext } from "@sendbird/uikit-react";
import ChannelListHeader from "@sendbird/uikit-react/ChannelList/components/ChannelListHeader";
import ChannelPreview from "@sendbird/uikit-react/ChannelList/components/ChannelPreview";
import { useChannelListContext } from "@sendbird/uikit-react/ChannelList/context";
import LeaveChannel from "@sendbird/uikit-react/ChannelSettings/components/LeaveChannel";
import { ChannelSettingsProvider, useChannelSettingsContext } from "@sendbird/uikit-react/ChannelSettings/context";
import CreateChannel from "@sendbird/uikit-react/CreateChannel";
import EditProfile from "@sendbird/uikit-react/EditUserProfile";
import axios from "axios";
import { useCallback, useState } from "react";


export const CustomChannelList = ({ selectedChannel, setSelectedChannel }) => {
    const { allChannels } = useChannelListContext()

    const [showAddChannel, setShowAddChannel] = useState<boolean>(false)
    const [showLeaveOption, setShowLeaveOption] = useState<string>("")
    const [showLeaveChannel, setShowLeaveChannel] = useState<boolean>(false)
    const [showProfileEdit, setShowProfileEdit] = useState<boolean>(false)

    const createChannelCallback = useCallback(async (e: GroupChannel) => {
        // create metacounter (for tracking messages)
        const counters = {
            messages: 0
        }

        await e.createMetaCounters(counters)

        const data = {
            url: e.url,
            createdBy: e.creator.userId,
            messageTotal: 0,
            chatmateIdentifier: e.memberCount > 2 ? "" : e.members[1].userId,
            createdAt: e.createdAt
        }
        await axios.post('/api/channel', data) 
    }, [])

    const deleteChannelCallback = useCallback(async (e: GroupChannel) => {
        const data = {
            url: e.url,
            deleted: true
        }

        await axios.patch('/api/channel', data)
    }, [])

    return (
        <>
            <ChannelListHeader allowProfileEdit onEdit={() => setShowProfileEdit(true)} renderIconButton={() => <AddChannelButton setShowAddChannel={setShowAddChannel} />} />
            { allChannels?.map((c, i) => {
                return (
                    <div key={i} onMouseOver={() => setShowLeaveOption(i.toString())} onMouseLeave={() => setShowLeaveOption("")}>
                            <ChannelPreview 
                                channel={c}
                                onClick={() => {
                                    setSelectedChannel(() => c)
                                }}
                                tabIndex={0} 
                                key={i}
                                isActive={c.url === selectedChannel?.url}
                                renderChannelAction={() => showLeaveOption == i.toString() && <LeaveChannelButton setShowLeaveChannel={setShowLeaveChannel}/> }
                            />
                    </div>
                )
            })}
            {showAddChannel && <CreateChannel onCancel={() => setShowAddChannel(false)} onCreateChannel={(e) => createChannelCallback(e)}/>}
            <ChannelSettingsProvider channelUrl={selectedChannel?.url}>
                {showLeaveChannel && <LeaveChannel onCancel={() => setShowLeaveChannel(false)} onSubmit={() => {
                    setShowLeaveChannel(false)
                    deleteChannelCallback(selectedChannel)
                }}/>}
            </ChannelSettingsProvider>
            {showProfileEdit && <EditProfile onCancel={() => setShowProfileEdit(false)}  onEditProfile={() => setShowProfileEdit(false)}/>}
            
        </>
    )
}

const AddChannelButton = ({ setShowAddChannel }) => {
    return (
        <button className={"btn btn-light"} onClick={() => setShowAddChannel(true)}>+</button>
    )
}

const LeaveChannelButton = ({ setShowLeaveChannel }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center' }} onClick={() => setShowLeaveChannel(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"/>
            </svg>
        </div>
    )
}