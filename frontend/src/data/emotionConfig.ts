export type EmotionConfig = {
    ui: {
        theme?: string;
        brightness_adjustment?: number;
        hide_panels?: string[];
        focus_panel?: string;
        highlight_primary_error_only?: boolean;
        disable_notifications?: boolean;
        highlight_active_file?: boolean;
        open_panels?: string[];
        dim_inactive_tabs?: boolean;
        show_inline_variable_values?: boolean;
        hide_chat_panel?: boolean;
        reduce_animations?: boolean;
        minimize_inline_hints?: boolean;
        font_size_adjustment?: number;
        increase_contrast?: boolean;
        increase_line_spacing?: boolean;
        soft_highlight_current_line?: boolean;
        slow_animations?: boolean;
        show_panels?: string[];
        highlight_code_smells?: boolean;
        enable_side_suggestions?: boolean;
    };
    hints: {
        auto_show: boolean;
        max_hints?: number;
        style?: string;
        explanation?: boolean;
        alternatives?: boolean;
        tone: string;
        examples?: string[];
        progressive_reveal?: boolean;
        levels?: string[];
        on_request_only?: boolean;
        summarize_error_first?: boolean;
        detail_level?: string;
        safe_suggestions_only?: boolean;
        multiple_options?: boolean;
        show_tradeoffs?: boolean;
    };
};

export const emotionConfig: Record<string, EmotionConfig> = {
    angry_frustrated: {
        ui: {
            theme: "dark_cool",
            brightness_adjustment: -0.15,
            hide_panels: ["file_explorer", "git", "extensions"],
            focus_panel: "error",
            highlight_primary_error_only: true,
            disable_notifications: true
        },
        hints: {
            auto_show: true,
            max_hints: 1,
            style: "direct_minimal",
            explanation: false,
            alternatives: false,
            tone: "neutral_strict",
            examples: [
                "Add `await` on line 42.",
                "Fix loop bound: change `i <= n` to `i < n`."
            ]
        }
    },

    confused: {
        ui: {
            highlight_active_file: true,
            open_panels: ["stack_trace", "call_hierarchy"],
            dim_inactive_tabs: true,
            show_inline_variable_values: true
        },
        hints: {
            auto_show: true,
            progressive_reveal: true,
            levels: [
                "The error comes from this function.",
                "The issue is in the loop condition.",
                "Change `i <= n` to `i < n`."
            ],
            explanation: true,
            tone: "guiding"
        }
    },

    focused: {
        ui: {
            hide_chat_panel: true,
            disable_notifications: true,
            reduce_animations: true,
            minimize_inline_hints: true
        },
        hints: {
            auto_show: false,
            on_request_only: true,
            style: "compact_technical",
            tone: "neutral",
            examples: [
                "Null dereference in `processUser()` — `user` may be undefined."
            ]
        }
    },

    tired: {
        ui: {
            font_size_adjustment: 1.1,
            increase_contrast: true,
            increase_line_spacing: true,
            soft_highlight_current_line: true,
            slow_animations: true
        },
        hints: {
            auto_show: true,
            summarize_error_first: true,
            detail_level: "high",
            safe_suggestions_only: true,
            tone: "gentle",
            examples: [
                "This error means the file path is incorrect.",
                "Add a null check before using this variable."
            ]
        }
    },

    calm_exploratory: {
        ui: {
            show_panels: ["refactor_suggestions", "performance_hints"],
            highlight_code_smells: true,
            enable_side_suggestions: true
        },
        hints: {
            auto_show: true,
            multiple_options: true,
            explanation: true,
            show_tradeoffs: true,
            tone: "exploratory",
            examples: [
                "You can solve this using recursion, DP, or greedy.",
                "This loop is O(n²). Want an O(n) version?"
            ]
        }
    }
};
