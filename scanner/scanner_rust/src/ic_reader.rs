
pub struct Card {
    pub idm: [u8; 8],
}

pub struct Reader {
    pub name: String,
}

impl Reader {
    pub fn read_card(&self) -> Card {
        // TODO: Implement actual card reading logic
        Card { idm: [0u8; 8] }
    }

    pub fn init() -> Self {
        // TODO: Implement actual reader initialization logic
        Reader { name: String::from("Default Reader") }
    }

    pub fn close(&self) {
        // TODO: Implement actual reader closing logic
    }
}


