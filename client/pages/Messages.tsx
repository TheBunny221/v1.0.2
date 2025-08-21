import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  MessageSquare,
  Send,
  Search,
  Users,
  Clock,
  CheckCheck,
  Plus,
} from "lucide-react";

const Messages: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>("1");
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const conversations = [
    {
      id: "1",
      name: "Maintenance Team Alpha",
      lastMessage: "Water pipeline repair completed",
      timestamp: "10:30 AM",
      unread: 2,
      online: true,
      type: "group",
    },
    {
      id: "2",
      name: "Ward Officer - Central",
      lastMessage: "Please assign the electrical issue to...",
      timestamp: "9:45 AM",
      unread: 0,
      online: true,
      type: "individual",
    },
    {
      id: "3",
      name: "Emergency Response Team",
      lastMessage: "Road blockage cleared",
      timestamp: "Yesterday",
      unread: 0,
      online: false,
      type: "group",
    },
    {
      id: "4",
      name: "Sanitation Team B",
      lastMessage: "Schedule updated for tomorrow",
      timestamp: "Yesterday",
      unread: 1,
      online: true,
      type: "group",
    },
  ];

  const messages = {
    "1": [
      {
        id: "1",
        sender: "John Doe",
        content: "Water pipeline repair at MG Road has been completed",
        timestamp: "10:30 AM",
        isOwn: false,
        type: "text",
      },
      {
        id: "2",
        sender: "You",
        content: "Great work! Please send the completion photos",
        timestamp: "10:32 AM",
        isOwn: true,
        type: "text",
      },
      {
        id: "3",
        sender: "John Doe",
        content: "Photos uploaded to the complaint record",
        timestamp: "10:35 AM",
        isOwn: false,
        type: "text",
      },
    ],
    "2": [
      {
        id: "1",
        sender: "Sarah Wilson",
        content:
          "Please assign the electrical issue at Broadway to the electrical team",
        timestamp: "9:45 AM",
        isOwn: false,
        type: "text",
      },
    ],
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedMessages = selectedChat
    ? messages[selectedChat as keyof typeof messages] || []
    : [];

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedChat) {
      // Add message logic here
      setNewMessage("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Team Communication
          </h1>
          <p className="text-gray-600">Internal messaging and coordination</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Conversations
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedChat(conversation.id)}
                  className={`p-3 cursor-pointer border-l-4 transition-colors ${
                    selectedChat === conversation.id
                      ? "bg-blue-50 border-blue-500"
                      : "hover:bg-gray-50 border-transparent"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {conversation.type === "group" ? (
                            <Users className="h-5 w-5" />
                          ) : (
                            conversation.name.charAt(0)
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.name}
                        </p>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">
                            {conversation.timestamp}
                          </span>
                          {conversation.unread > 0 && (
                            <Badge className="bg-blue-600 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {conversations.find((c) => c.id === selectedChat)?.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {conversations.find((c) => c.id === selectedChat)?.online
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto space-y-4">
                {selectedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isOwn
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {!message.isOwn && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {message.sender}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className="text-xs opacity-70">
                          {message.timestamp}
                        </span>
                        {message.isOwn && (
                          <CheckCheck className="h-3 w-3 opacity-70" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[60px] resize-none"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  Select a conversation to start messaging
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Communication Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Chats
                </p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Team Members
                </p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Response
                </p>
                <p className="text-2xl font-bold">12m</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Today's Messages
                </p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
