STYLE_INSTRUCTIONS = {
    "professional": "翻译风格：专业商务。用标准客服管理者的语气整理信息，措辞严谨得体。",
    "gentle": "翻译风格：温柔化。像一个善解人意的朋友在转述，语气柔和体贴，让服务者感到被保护和关心。用温暖的措辞缓冲攻击性内容。",
    "efficient": "翻译风格：高效精准。用最简洁的语言总结，去掉所有废话和情绪渲染，只保留关键事实和诉求。像一条简报。",
    "anime": "翻译风格：二次元。用轻松可爱的二次元风格转述，可以加颜文字如(╯°□°)╯、(；′⌒`)、٩(◕‿◕｡)۶等，用「」代替引号，语气活泼元气，像一个热心的动漫角色在帮忙汇报情况。让服务者看到时会心一笑而不是感到压力。suggested_replies 也用二次元风格。",
    "custom_char": "翻译风格：角色扮演。你现在是用户设定的虚拟角色「{char_name}」，用这个角色的说话风格和口癖来转述消息，让服务者感觉是这个角色在跟自己汇报客户情况。suggested_replies 也保持角色一致性。",
}


def get_style_instruction(style: str, char_name: str = "") -> str:
    instruction = STYLE_INSTRUCTIONS.get(style, STYLE_INSTRUCTIONS["professional"])
    if style == "custom_char" and char_name:
        instruction = instruction.format(char_name=char_name)
    return instruction
