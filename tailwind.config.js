export default {
    content: [
        "./templates/**/*.html",
        "./apps/**/templates/**/*.html",
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ["IBM Plex Mono", "monospace"],
            },
            colors: {
                dark: {
                    bg: "#080808",
                    surface: "#121212",
                },
                brand: {
                    primary: "#3490dc",
                },
            },
        },
    },
    darkMode: "class",
}
