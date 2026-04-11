- floor-1
    - room-101
        - ARCH
        - FUR
        - AC
            - AC-101-1 { Type: 42TGF0361CP, 
                        AssetID: สถ.2568-123-456-001, 
                        InstallDate: 2024-02-01 }
                - FCU-101-1
                    - PIPE-DRN-101-1
                - CDU-101-1
                    - PIPE-ELE-101-1 { ConnectsFrom: CU-1-01 }
                    - PIPE-REF-101-1 { ConnectsTo: FCU-101-1 }
            - AC-101-2 { Type: 42TGF0361CP, 
                        AssetID: สถ.2568-123-456-002, 
                        InstallDate: 2025-05-10 }
                - FCU-101-2
                    - PIPE-DRN-101-2
                - CDU-101-2
                    - PIPE-ELE-101-2 { ConnectsFrom: CU-1-01 }
                    - PIPE-REF-101-2 { ConnectsTo: FCU-101-2 }
            - AC-101-3 { Type: 42TGF0361CP, 
                        AssetID: สถ.2568-123-456-003, 
                        InstallDate: 2022-12-21 }
                - FCU-101-3
                    - PIPE-DRN-101-3
                - CDU-101-3
                    - PIPE-ELE-101-3 { ConnectsFrom: CU-1-01 }
                    - PIPE-REF-101-3 { ConnectsTo: FCU-101-3 }
            - AC-101-4 { Type: 42TGF0361CP, 
                        AssetID: สถ.2568-123-456-004, 
                        InstallDate: 2024-02-01 }
                - FCU-101-4
                    - PIPE-DRN-101-4
                - CDU-101-4
                    - PIPE-ELE-101-4 { ConnectsFrom: CU-1-01,
                                        ConnectsTo: CDU-101-4 }
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
        - ARCH
        - FUR
        - AC
            - AC-102-1 { Type: 42TGF0241CP, 
                        AssetID: สถ.2568-123-456-005, 
                        InstallDate: 2025-01-01 }
                - FCU-102-1
                    - PIPE-DRN-102-1
                - CDU-102-1
                    - PIPE-ELE-102-1 { ConnectsFrom: LP-123 }
                    - PIPE-REF-102-1 { ConnectsTo: FCU-102-1 }
        - EE
