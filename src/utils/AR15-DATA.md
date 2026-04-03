- ar15
    - LP-123 { Type: LoadPanel }
    - LP-EE-1-4 { Type: LoadPanel, 
                ConnectsFrom: LP-123 }
    - floor-1
        - room-101
            - AC
                - AC-101-1 { Type: 42TGF0361CP, 
                            AssetID: สถ.2568-123-456-001, 
                            InstallDate: 2024-02-01 }
                    - FCU-101-1
                        - PIPE-DRN-101-1
                    - CDU-101-1
                        - PIPE-ELE-101-1 { ConnectsFrom: LP-123 }
                        - PIPE-REF-101-1 { ConnectsTo: FCU-101-1 }
                - AC-101-2 { Type: 42TGF0361CP, 
                            AssetID: สถ.2568-123-456-002, 
                            InstallDate: 2025-05-10 }
                    - FCU-101-2
                        - PIPE-DRN-101-2
                    - CDU-101-2
                        - PIPE-ELE-101-2 { ConnectsFrom: LP-123 }
                        - PIPE-REF-101-2 { ConnectsTo: FCU-101-2 }
                - AC-101-3 { Type: 42TGF0361CP, 
                            AssetID: สถ.2568-123-456-003, 
                            InstallDate: 2022-12-21 }
                    - FCU-101-3
                        - PIPE-DRN-101-3
                    - CDU-101-3
                        - PIPE-ELE-101-3 { ConnectsFrom: LP-123 }
                        - PIPE-REF-101-3 { ConnectsTo: FCU-101-3 }
                - AC-101-4 { Type: 42TGF0361CP, 
                            AssetID: สถ.2568-123-456-004, 
                            InstallDate: 2025-01-01 }
                    - FCU-101-4
                        - PIPE-DRN-101-4
                    - CDU-101-4
                        - PIPE-ELE-101-4 { ConnectsFrom: LP-123 }
                        - PIPE-REF-101-4 { ConnectsTo: FCU-101-4 }
            - EE
                - PG-101.1 { 
                    TYPE: PG-01,
                    ASSetID: สถ.2568-123,
                    InstallDate: 2025-01-01}
                - SW-101.B {
                    TYPE: SW-01,
                    ASSetID: สถ.2568-123,
                    InstallDate: 2025-01-01,
                    ConnectsFrom: LP-3}
                    - LI-101.B1 {
                        TYPE: LI-01,
                        ASSetID: สถ.2568-123,
                        InstallDate: 2025-01-01}
                    - LI-101.B2 {
                        TYPE: LI-01,
                        ASSetID: สถ.2568-123,
                        InstallDate: 2025-01-01}
                    - LI-101.B3 {
                        TYPE: LI-01,
                        ASSetID: สถ.2568-123,
                        InstallDate: 2025-01-01}
                    - LI-101.B4 {
                        TYPE: LI-01,
                        ASSetID: สถ.2568-123,
                        InstallDate: 2025-01-01}
                    - LI-101.B5 {
                        TYPE: LI-01,
                        ASSetID: สถ.2568-123,
                        InstallDate: 2025-01-01}
                    - LI-101.B6 {
                        TYPE: LI-01,
                        ASSetID: สถ.2568-123,
                        InstallDate: 2025-01-01}
        - room-102
            - AC-102-1 { Type: 42TGF0241CP, 
                        AssetID: สถ.2568-123-456-005, 
                        InstallDate: 2025-01-01 }
                - FCU-102-1
                    - PIPE-DRN-102-1
                - CDU-102-1
                    - PIPE-ELE-102-1 { ConnectsFrom: LP-123 }
                    - PIPE-REF-102-1 { ConnectsTo: FCU-102-1 }
    - floor-2
        - room-201
            - AC-201-1 { Type: 42TGF0361CP, 
                        AssetID: สถ.2568-123-456-006, 
                        InstallDate: 2025-01-01 }
                - FCU-201-1
                    - PIPE-DRN-201-1
                - CDU-201-1
                    - PIPE-ELE-201-1 { ConnectsFrom: LP-123 }
                    - PIPE-REF-201-1 { ConnectsTo: FCU-201-1 }
            - AC-201-2 { Type: 42TGF0361CP, 
                        AssetID: สถ.2568-123-456-007, 
                        InstallDate: 2025-01-01 }
                - FCU-201-2
                    - PIPE-DRN-201-2
                - CDU-201-2
                    - PIPE-ELE-201-2 { ConnectsFrom: LP-123 }
                    - PIPE-REF-201-2 { ConnectsTo: FCU-201-2 }
            - AC-201-3 { Type: 42TGF0361CP, 
                        AssetID: สถ.2568-123-456-008, 
                        InstallDate: 2025-01-01 }
                - FCU-201-3
                    - PIPE-DRN-201-3
                - CDU-201-3
                    - PIPE-ELE-201-3 { ConnectsFrom: LP-123 }
                    - PIPE-REF-201-3 { ConnectsTo: FCU-201-3 }
        - room-202
            - AC-202-1 { Type: 42TGF0241CP, 
                        AssetID: สถ.2568-123-456-009, 
                        InstallDate: 2025-01-01 }
                - FCU-202-1
                    - PIPE-DRN-202-1
                - CDU-202-1
                    - PIPE-ELE-202-1 { ConnectsFrom: LP-123 }
                    - PIPE-REF-202-1 { ConnectsTo: FCU-202-1 }
        - room-203
            - AC-203-1 { Type: 42TGF0241CP, 
                        AssetID: สถ.2568-123-456-010, 
                        InstallDate: 2025-01-01 }
                - FCU-203-1
                    - PIPE-DRN-203-1
                - CDU-203-1
                    - PIPE-ELE-203-1 { ConnectsFrom: LP-123 }
                    - PIPE-REF-203-1 { ConnectsTo: FCU-203-1 }
        - room-204
            - AC-204-1 { Type: 42TGF0241CP, 
                        AssetID: สถ.2568-123-456-011, 
                        InstallDate: 2025-01-01 }
                - FCU-204-1
                    - PIPE-DRN-204-1
                - CDU-204-1
                    - PIPE-ELE-204-1 { ConnectsFrom: LP-123 }
                    - PIPE-REF-204-1 { ConnectsTo: FCU-204-1 }
        - room-205
            - AC-205-1 { Type: 42TGF0241CP, 
                        AssetID: สถ.2568-123-456-012, 
                        InstallDate: 2025-01-01 }
                - FCU-205-1
                    - PIPE-DRN-205-1
                - CDU-205-1
                    - PIPE-ELE-205-1 { ConnectsFrom: LP-123 }
                    - PIPE-REF-205-1 { ConnectsTo: FCU-205-1 }
        - room-206
            - AC-206-1 { Type: 42TGF0361CP, 
                        AssetID: สถ.2568-123-456-013, 
                        InstallDate: 2025-01-01 }
                - FCU-206-1
                    - PIPE-DRN-206-1
                - CDU-206-1
                    - PIPE-ELE-206-1 { ConnectsFrom: LP-123 }
                    - PIPE-REF-206-1 { ConnectsTo: FCU-206-1 }
            - AC-206-2 { Type: 42TGF0361CP, 
                        AssetID: สถ.2568-123-456-014, 
                        InstallDate: 2025-01-01 }
                - FCU-206-2
                    - PIPE-DRN-206-2
                - CDU-206-2
                    - PIPE-ELE-206-2 { ConnectsFrom: LP-123 }
                    - PIPE-REF-206-2 { ConnectsTo: FCU-206-2 }
                    