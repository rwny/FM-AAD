- AR19
    - floor-1
        - room-101
            - ARCH
            - FUR
            - AC
                - AC-119-1 { Type: 42TGF0361CP, 
                            AssetID: สถ.2569-119-456-001, 
                            InstallDate: 2025-03-15 }
                    - FCU-119-1
                        - PIPE-DRN-119-1
                    - CDU-119-1
                        - PIPE-ELE-119-1 { ConnectsFrom: CU-1-01 }
                        - PIPE-REF-119-1 { ConnectsTo: FCU-119-1 }
                - AC-119-2 { Type: 42TGF0241CP, 
                            AssetID: สถ.2569-119-456-002, 
                            InstallDate: 2025-06-20 }
                    - FCU-119-2
                        - PIPE-DRN-119-2
                    - CDU-119-2
                        - PIPE-ELE-119-2 { ConnectsFrom: CU-1-01 }
                        - PIPE-REF-119-2 { ConnectsTo: FCU-119-2 }
            - EE
                - PG-101 {
                    TYPE: PG-01,
                    AssetID: สถ.2569-119,
                    InstallDate: 2025-03-01 }
                - SW-101 {
                    TYPE: SW-01,
                    AssetID: สถ.2569-119,
                    InstallDate: 2025-03-01,
                    ConnectsFrom: LP-123 }
                    - LI-101.1 { TYPE: LI-01, AssetID: สถ.2569-119, InstallDate: 2025-03-01 }
                    - LI-101.2 { TYPE: LI-01, AssetID: สถ.2569-119, InstallDate: 2025-03-01 }
                    - LI-101.3 { TYPE: LI-01, AssetID: สถ.2569-119, InstallDate: 2025-03-01 }
                    - LI-101.4 { TYPE: LI-01, AssetID: สถ.2569-119, InstallDate: 2025-03-01 }
        - room-102
            - ARCH
            - FUR
            - AC
                - AC-119-3 { Type: 42TGF0361CP, 
                            AssetID: สถ.2569-119-456-003, 
                            InstallDate: 2025-02-10 }
                    - FCU-119-3
                        - PIPE-DRN-119-3
                    - CDU-119-3
                        - PIPE-ELE-119-3 { ConnectsFrom: CU-1-01 }
                        - PIPE-REF-119-3 { ConnectsTo: FCU-119-3 }
            - EE
                - PG-102 {
                    TYPE: PG-01,
                    AssetID: สถ.2569-119,
                    InstallDate: 2025-05-01 }
                - SW-102 {
                    TYPE: SW-01,
                    AssetID: สถ.2569-119,
                    InstallDate: 2025-05-01,
                    ConnectsFrom: LP-123 }
                    - LI-102.1 { TYPE: LI-01, AssetID: สถ.2569-119, InstallDate: 2025-05-01 }
                    - LI-102.2 { TYPE: LI-01, AssetID: สถ.2569-119, InstallDate: 2025-05-01 }
    - floor-2
        - room-201
            - ARCH
            - FUR
            - AC
                - AC-119-4 { Type: 42TGF0241CP, 
                            AssetID: สถ.2569-119-456-004, 
                            InstallDate: 2025-08-01 }
                    - FCU-119-4
                        - PIPE-DRN-119-4
                    - CDU-119-4
                        - PIPE-ELE-119-4 { ConnectsFrom: CU-1-01 }
                        - PIPE-REF-119-4 { ConnectsTo: FCU-119-4 }
            - EE
                - PG-201 {
                    TYPE: PG-01,
                    AssetID: สถ.2569-119,
                    InstallDate: 2025-04-01 }
                - SW-201 {
                    TYPE: SW-01,
                    AssetID: สถ.2569-119,
                    InstallDate: 2025-10-01,
                    ConnectsFrom: LP-123 }
                    - LI-201.1 { TYPE: LI-01, AssetID: สถ.2569-119, InstallDate: 2025-10-01 }
                    - LI-201.2 { TYPE: LI-01, AssetID: สถ.2569-119, InstallDate: 2025-10-01 }
        - room-202
            - ARCH
            - FUR
            - AC
                - AC-119-5 { Type: 42TGF0361CP, 
                            AssetID: สถ.2569-119-456-005, 
                            InstallDate: 2025-09-15 }
                    - FCU-119-5
                        - PIPE-DRN-119-5
                    - CDU-119-5
                        - PIPE-ELE-119-5 { ConnectsFrom: CU-1-01 }
                        - PIPE-REF-119-5 { ConnectsTo: FCU-119-5 }
            - EE
                - PG-202 {
                    TYPE: PG-01,
                    AssetID: สถ.2569-119,
                    InstallDate: 2025-07-01 }
                - SW-202 {
                    TYPE: SW-01,
                    AssetID: สถ.2569-119,
                    InstallDate: 2025-07-01,
                    ConnectsFrom: LP-123 }
                    - LI-202.1 { TYPE: LI-01, AssetID: สถ.2569-119, InstallDate: 2025-07-01 }
                    - LI-202.2 { TYPE: LI-01, AssetID: สถ.2569-119, InstallDate: 2025-07-01 }
    - COMMON
        - CU-1-01 { Type: ConsumerUnitx }
        - LP-123 { Type: LoadPanel }
    - SANITARY
        - P-SEPT-IN
        - P-SEPT-OUT
        - P-VENT-ST
        - SEPT-101
        - Manhole-1
        - VTR-1
    - CCTV
        - NVR-1 { Type: NVR, 
                    AssetID: สถ.2569-cctv-119-001, 
                    InstallDate: 2025-06-01 }
            - CCTV-1 { Type: CCTV-xiaomi-home14852pro, 
                        AssetID: สถ.2569-cctv-119-002, 
                        InstallDate: 2025-06-01,
                        Monitors: room-101 }
            - CCTV-2 { Type: CCTV-xiaomi-home14852pro, 
                        AssetID: สถ.2569-cctv-119-003, 
                        InstallDate: 2025-06-01,
                        Monitors: room-102 }
            - CCTV-3 { Type: CCTV-xiaomi-home14852pro, 
                        AssetID: สถ.2569-cctv-119-004, 
                        InstallDate: 2025-06-01,
                        Monitors: room-201 }
            - CCTV-4 { Type: CCTV-xiaomi-home14852pro, 
                        AssetID: สถ.2569-cctv-119-005, 
                        InstallDate: 2025-06-01,
                        Monitors: room-202 }
