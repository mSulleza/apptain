import { Channel, sendBirdSelectors, useSendbirdStateContext } from "@sendbird/uikit-react"
import { useChannelContext } from "@sendbird/uikit-react/Channel/context"
import { MessageProvider, useMessageContext } from "@sendbird/uikit-react/Message/context"
import axios from "axios"
import { useCallback, useState } from "react"

export const CustomGroupChannel = ({ currentChannel }) => {

    console.log(currentChannel)
    return (
        <div style={{ height: "100vh" }}>
            <Channel  renderMessage={(message) => <CustomizedMessage data={message}/>} channelUrl={currentChannel?.url} renderMessageInput={() => <CustomizedMessageInput channel={currentChannel} />}></Channel>
        </div>
    )
}

const CustomizedMessage = ({ data }) => {
    const { message } = data

    const globalStore = useSendbirdStateContext()

    const [displayOptions, setDisplayOptions] = useState<boolean>(false)
    const userId = globalStore.stores.userStore.user.userId
    
    const deleteMessage = sendBirdSelectors.getDeleteMessage(globalStore)
    const getGetGroupChannel = sendBirdSelectors.getGetGroupChannel(globalStore)

    const deleteMessageHandler = useCallback(async () => {
        const currentChannel = await getGetGroupChannel(message.channelUrl)

        deleteMessage(currentChannel, message)
            .then(() => {
                const data = {
                    messageId: message.messageId,
                    deleted: true,
                }

                axios.patch("/api/message", data)
            })
            .catch((e) => {
                throw new Error(e)
            })
    }, [])

    return (
        <MessageProvider message={data} >
            <div style={{ display: "flex", flexDirection: message.sender.userId === userId ? "row-reverse" : "row" }} onMouseOver={() => {setDisplayOptions(true)}} onMouseOut={() => {setDisplayOptions(false)}}>
                <div className={`rounded`} style={{ padding: "1rem", marginBottom: "1rem", backgroundColor: "rgb(208,171,255)"}}>
                    <div style={{ alignContent: "space-between", flexWrap: "wrap" }}>
                        <div>{message.message}</div>
                        {message.sendingStatus === "succeeded"}<div style={{ fontSize: "7px" }}>Sent</div>
                    </div>
                </div>
                { displayOptions && <div style={{ display: "flex", alignItems: "center", paddingBottom: "15px", marginRight: "5px", cursor: "pointer" }} onClick={deleteMessageHandler}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512">
                        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                    </svg>
                </div>}
            </div>
        </MessageProvider>
    )
}

const CustomizedEditInput = () => {
    const { message } = useMessageContext()
    const { channelUrl } = useChannelContext()
    const [textInput, setTextInput] = useState<string>(message["message"].message)
    const [showEdit, setShowEdit] = useState(true)

    const globalStore = useSendbirdStateContext()
    
    const getGetGroupChannel = sendBirdSelectors.getGetGroupChannel(globalStore)
    const updateMessage = sendBirdSelectors.getUpdateUserMessage(globalStore)

    const updateMessageHandler = useCallback(async () => {

        setShowEdit(false)

        const channel = await getGetGroupChannel(channelUrl)
        const params = { message: textInput }

        updateMessage(channel, message["message"].messageId, params)
            .then((m) => {
                const data = {
                    messageId: m.messageId,
                    message: m.message
                }

                axios.patch("/api/message", data)
            })
            .catch((e) => {
                throw new Error(e)
            })

    }, [textInput])
    return (
        showEdit && 
            <div className="container">
                <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} className="form-control" rows={2} cols={3} style={{ resize: "none" }}></textarea>
                <div>
                    <button className="btn btn-light" style={{ marginTop: "10px" }} onClick={() => setShowEdit(false)}>Close</button>
                    <button className="btn btn-light" style={{ marginTop: "10px", marginLeft: "10px" }} onClick={updateMessageHandler}>Save</button>
                </div>  
            </div>
    )
}

const CustomizedMessageInput = ({ channel }) => {
    const [messageInput, setMessageInput] = useState<string>("")

    const globalStore = useSendbirdStateContext()
    
    const sendMessage = sendBirdSelectors.getSendUserMessage(globalStore)
    const getCurrentChannel = sendBirdSelectors.getGetGroupChannel(globalStore)

    const sendMessageHandler = useCallback(async () => {
        const params = { message: messageInput }

        if (messageInput.length === 0) return
        
        const currentChannel = await getCurrentChannel(channel.url)
        
        sendMessage(currentChannel, params)
            .onSucceeded( async (message) => {
                setMessageInput("")
                
                // increment meta counter
                await currentChannel.increaseMetaCounters({ messages: 1})
                const totalMessages = await currentChannel.getMetaCounters(['messages'])

                console.log(totalMessages) 
                const data = {
                    message: message["message"],
                    messageId: message.messageId.toString(),
                    senderIdentifier: message.sender.userId,
                    receiverIdentifier: currentChannel.members.flatMap((e) => e.userId).toString(),
                    channelUrl: message.channelUrl,
                    sentAt: message.createdAt,
                    type: message.messageType
                }
                axios.post("/api/message", data)

                // update message count in db
                const channelData = {
                    url: currentChannel.url,
                    messageTotal: totalMessages["messages"],
                }

                const res = await axios.patch("/api/channel", channelData)

                console.log(res)
            })
            .onFailed(() => { throw new Error("Error sending message!")})

    }, [channel, messageInput])

    return (
        <div style={{ paddingLeft: '1rem', paddingRight: '1rem', display: 'flex' }}>
            <textarea className={"form-control"} style={{ resize: "none" }} rows={3} value={messageInput} onChange={(e) => setMessageInput(e.target.value)} />
            <button className={"btn btn-light"} style={{ padding: '1rem', marginLeft: '1rem' }} onClick={sendMessageHandler}>
                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
                    <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/>
                </svg>
            </button>
        </div>

    )
}