import SwiftUI
import SceneKit

// MARK: - UIColor from SwiftUI Color helper

func uiColorForVial(name: String) -> UIColor {
    let n = name.lowercased()
    if n.contains("semaglutide") || n.contains("tirzepatide") || n.contains("retatrutide") || n.contains("aod") {
        return UIColor.systemGreen
    } else if n.contains("semax") || n.contains("selank") || n.contains("dsip") || n.contains("pinealon") {
        return UIColor.systemPurple
    } else if n.contains("bpc") || n.contains("tb-500") || n.contains("wolverine") || n.contains("glow") || n.contains("klow") || n.contains("tri-heal") {
        return UIColor(red: 0.1, green: 0.54, blue: 0.53, alpha: 1) // cxTeal
    } else if n.contains("ipamorelin") || n.contains("cjc") || n.contains("sermorelin") || n.contains("tesamorelin") || n.contains("ghrp") {
        return UIColor(red: 0.85, green: 0.65, blue: 0.2, alpha: 1) // Gold
    }
    return UIColor(red: 0.1, green: 0.54, blue: 0.53, alpha: 1)
}

// MARK: - SceneKit 3D Vial

struct SceneKitVialView: UIViewRepresentable {
    let name: String
    let dose: String
    let fillPercent: Double
    let isRotating: Bool

    func makeUIView(context: Context) -> SCNView {
        let sceneView = SCNView()
        sceneView.backgroundColor = .clear
        sceneView.allowsCameraControl = false
        sceneView.autoenablesDefaultLighting = false
        sceneView.antialiasingMode = .multisampling4X

        let scene = SCNScene()
        sceneView.scene = scene

        // Camera
        let cameraNode = SCNNode()
        cameraNode.camera = SCNCamera()
        cameraNode.camera?.fieldOfView = 30
        cameraNode.position = SCNVector3(0, 0.03, 0.15)
        cameraNode.look(at: SCNVector3(0, 0.025, 0))
        scene.rootNode.addChildNode(cameraNode)

        // Lighting
        let keyLight = SCNNode()
        keyLight.light = SCNLight()
        keyLight.light?.type = .directional
        keyLight.light?.color = UIColor.white
        keyLight.light?.intensity = 800
        keyLight.position = SCNVector3(0.1, 0.1, 0.1)
        keyLight.look(at: SCNVector3(0, 0.025, 0))
        scene.rootNode.addChildNode(keyLight)

        let fillLight = SCNNode()
        fillLight.light = SCNLight()
        fillLight.light?.type = .directional
        fillLight.light?.color = UIColor(white: 0.9, alpha: 1)
        fillLight.light?.intensity = 400
        fillLight.position = SCNVector3(-0.1, 0.05, 0.05)
        fillLight.look(at: SCNVector3(0, 0.025, 0))
        scene.rootNode.addChildNode(fillLight)

        let ambientLight = SCNNode()
        ambientLight.light = SCNLight()
        ambientLight.light?.type = .ambient
        ambientLight.light?.color = UIColor(white: 0.4, alpha: 1)
        ambientLight.light?.intensity = 300
        scene.rootNode.addChildNode(ambientLight)

        // Environment for reflections
        let envLight = SCNNode()
        envLight.light = SCNLight()
        envLight.light?.type = .probe
        envLight.light?.intensity = 500
        scene.rootNode.addChildNode(envLight)

        // Vial parent node
        let vialNode = SCNNode()
        vialNode.name = "vial"
        scene.rootNode.addChildNode(vialNode)

        // Build the vial
        buildVial(parent: vialNode)

        // Rotation animation
        if isRotating {
            let rotation = CABasicAnimation(keyPath: "rotation")
            rotation.fromValue = SCNVector4(0, 1, 0, 0)
            rotation.toValue = SCNVector4(0, 1, 0, Float.pi * 2)
            rotation.duration = 4.0
            rotation.repeatCount = .infinity
            vialNode.addAnimation(rotation, forKey: "rotate")
        }

        return sceneView
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        // Update fill level if needed
        if let liquidNode = uiView.scene?.rootNode.childNode(withName: "vial", recursively: false)?
            .childNode(withName: "liquid", recursively: false) {
            let bodyHeight: Float = 0.038
            let fillH = Float(max(0.002, fillPercent * Double(bodyHeight)))
            liquidNode.scale = SCNVector3(1, fillH / 0.038, 1)
            liquidNode.position = SCNVector3(0, fillH / 2 + 0.003, 0)
        }
    }

    func buildVial(parent: SCNNode) {
        let capColor = uiColorForVial(name: name)

        // === Glass Body ===
        let bodyRadius: CGFloat = 0.01
        let bodyHeight: CGFloat = 0.038
        let bodyCylinder = SCNCylinder(radius: bodyRadius, height: bodyHeight)
        bodyCylinder.radialSegmentCount = 48

        let glassMaterial = SCNMaterial()
        glassMaterial.diffuse.contents = UIColor(white: 0.95, alpha: 0.15)
        glassMaterial.transparent.contents = UIColor(white: 1.0, alpha: 0.12)
        glassMaterial.transparency = 0.85
        glassMaterial.fresnelExponent = 3.0
        glassMaterial.specular.contents = UIColor.white
        glassMaterial.shininess = 128
        glassMaterial.reflective.contents = UIColor(white: 0.3, alpha: 1)
        glassMaterial.lightingModel = .physicallyBased
        glassMaterial.metalness.contents = UIColor(white: 0.0, alpha: 1)
        glassMaterial.roughness.contents = UIColor(white: 0.05, alpha: 1)
        glassMaterial.isDoubleSided = true
        glassMaterial.blendMode = .alpha
        bodyCylinder.materials = [glassMaterial]

        let bodyNode = SCNNode(geometry: bodyCylinder)
        bodyNode.position = SCNVector3(0, Float(bodyHeight / 2) + 0.003, 0)
        parent.addChildNode(bodyNode)

        // === Glass Bottom (rounded) ===
        let bottomSphere = SCNSphere(radius: bodyRadius)
        bottomSphere.segmentCount = 48
        bottomSphere.materials = [glassMaterial]
        let bottomNode = SCNNode(geometry: bottomSphere)
        bottomNode.scale = SCNVector3(1, 0.3, 1)
        bottomNode.position = SCNVector3(0, 0.003, 0)
        parent.addChildNode(bottomNode)

        // === Liquid Fill ===
        let liquidRadius: CGFloat = bodyRadius - 0.001
        let liquidHeight = CGFloat(max(0.002, fillPercent * Double(bodyHeight)))
        let liquidCylinder = SCNCylinder(radius: liquidRadius, height: liquidHeight)
        liquidCylinder.radialSegmentCount = 48

        let liquidMaterial = SCNMaterial()
        liquidMaterial.diffuse.contents = capColor.withAlphaComponent(0.3)
        liquidMaterial.transparency = 0.6
        liquidMaterial.lightingModel = .physicallyBased
        liquidMaterial.roughness.contents = UIColor(white: 0.3, alpha: 1)
        liquidMaterial.metalness.contents = UIColor(white: 0.0, alpha: 1)
        liquidCylinder.materials = [liquidMaterial]

        let liquidNode = SCNNode(geometry: liquidCylinder)
        liquidNode.name = "liquid"
        liquidNode.position = SCNVector3(0, Float(liquidHeight / 2) + 0.003, 0)
        parent.addChildNode(liquidNode)

        // === Neck (narrower cylinder) ===
        let neckRadius: CGFloat = 0.006
        let neckHeight: CGFloat = 0.008
        let neckCylinder = SCNCylinder(radius: neckRadius, height: neckHeight)
        neckCylinder.radialSegmentCount = 48
        neckCylinder.materials = [glassMaterial]

        let neckNode = SCNNode(geometry: neckCylinder)
        neckNode.position = SCNVector3(0, Float(bodyHeight) + Float(neckHeight / 2) + 0.003, 0)
        parent.addChildNode(neckNode)

        // === Shoulder taper (cone connecting body to neck) ===
        let shoulder = SCNCone(topRadius: neckRadius, bottomRadius: bodyRadius, height: 0.004)
        shoulder.radialSegmentCount = 48
        shoulder.materials = [glassMaterial]
        let shoulderNode = SCNNode(geometry: shoulder)
        shoulderNode.position = SCNVector3(0, Float(bodyHeight) + 0.003 - 0.001, 0)
        parent.addChildNode(shoulderNode)

        // === Rubber Stopper ===
        let stopperRadius: CGFloat = neckRadius - 0.0005
        let stopperHeight: CGFloat = 0.004
        let stopperCylinder = SCNCylinder(radius: stopperRadius, height: stopperHeight)
        stopperCylinder.radialSegmentCount = 48

        let stopperMaterial = SCNMaterial()
        stopperMaterial.diffuse.contents = UIColor(red: 0.45, green: 0.42, blue: 0.40, alpha: 1)
        stopperMaterial.lightingModel = .physicallyBased
        stopperMaterial.roughness.contents = UIColor(white: 0.7, alpha: 1)
        stopperMaterial.metalness.contents = UIColor(white: 0.0, alpha: 1)
        stopperCylinder.materials = [stopperMaterial]

        let stopperNode = SCNNode(geometry: stopperCylinder)
        stopperNode.position = SCNVector3(0, Float(bodyHeight + neckHeight) + 0.003, 0)
        parent.addChildNode(stopperNode)

        // === Metal Cap (crimp cap) ===
        let capRadius: CGFloat = bodyRadius + 0.001
        let capHeight: CGFloat = 0.007
        let capCylinder = SCNCylinder(radius: capRadius, height: capHeight)
        capCylinder.radialSegmentCount = 48

        let capMaterial = SCNMaterial()
        capMaterial.diffuse.contents = capColor
        capMaterial.lightingModel = .physicallyBased
        capMaterial.metalness.contents = UIColor(white: 0.9, alpha: 1)
        capMaterial.roughness.contents = UIColor(white: 0.3, alpha: 1)
        capMaterial.specular.contents = UIColor.white
        capCylinder.materials = [capMaterial]

        let capNode = SCNNode(geometry: capCylinder)
        capNode.position = SCNVector3(0, Float(bodyHeight + neckHeight) + Float(capHeight / 2) + 0.001, 0)
        parent.addChildNode(capNode)

        // === Cap top (flat disc) ===
        let capTop = SCNCylinder(radius: capRadius, height: 0.001)
        capTop.radialSegmentCount = 48
        capTop.materials = [capMaterial]
        let capTopNode = SCNNode(geometry: capTop)
        capTopNode.position = SCNVector3(0, Float(bodyHeight + neckHeight + capHeight) + 0.001, 0)
        parent.addChildNode(capTopNode)

        // === Label (flat plane on front) ===
        let labelWidth: CGFloat = bodyRadius * 1.6
        let labelHeight: CGFloat = bodyHeight * 0.5
        let labelPlane = SCNPlane(width: labelWidth, height: labelHeight)

        let labelMaterial = SCNMaterial()
        labelMaterial.diffuse.contents = createLabelImage(
            name: name, dose: dose, width: 256, height: 160, capColor: capColor
        )
        labelMaterial.lightingModel = .physicallyBased
        labelMaterial.roughness.contents = UIColor(white: 0.5, alpha: 1)
        labelMaterial.metalness.contents = UIColor(white: 0.0, alpha: 1)
        labelMaterial.isDoubleSided = false
        labelPlane.materials = [labelMaterial]

        let labelNode = SCNNode(geometry: labelPlane)
        labelNode.position = SCNVector3(0, Float(bodyHeight / 2) + 0.005, Float(bodyRadius) + 0.0005)
        parent.addChildNode(labelNode)
    }

    // Generate label texture
    func createLabelImage(name: String, dose: String, width: Int, height: Int, capColor: UIColor) -> UIImage {
        let size = CGSize(width: width, height: height)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            // White label background with rounded corners
            let rect = CGRect(origin: .zero, size: size)
            let path = UIBezierPath(roundedRect: rect.insetBy(dx: 4, dy: 4), cornerRadius: 8)
            UIColor.white.setFill()
            path.fill()

            // Thin border
            UIColor(white: 0.85, alpha: 1).setStroke()
            path.lineWidth = 1
            path.stroke()

            // Color accent line at top
            let accentRect = CGRect(x: 8, y: 8, width: CGFloat(width) - 16, height: 4)
            capColor.setFill()
            UIBezierPath(roundedRect: accentRect, cornerRadius: 2).fill()

            // "CORTEX" text
            let cortexAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 16, weight: .bold),
                .foregroundColor: UIColor(red: 0.1, green: 0.54, blue: 0.53, alpha: 1),
                .kern: 3.0
            ]
            let cortexStr = NSAttributedString(string: "CORTEX", attributes: cortexAttrs)
            let cortexSize = cortexStr.size()
            cortexStr.draw(at: CGPoint(x: (CGFloat(width) - cortexSize.width) / 2, y: 18))

            // Peptide name
            let shortName = name
                .replacingOccurrences(of: " (research)", with: "")
                .replacingOccurrences(of: " (not a peptide, but commonly discussed)", with: "")
            let displayName = shortName.count > 14 ? String(shortName.prefix(13)) + "..." : shortName

            let nameAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 18, weight: .semibold),
                .foregroundColor: UIColor.black
            ]
            let nameStr = NSAttributedString(string: displayName, attributes: nameAttrs)
            let nameSize = nameStr.size()
            nameStr.draw(at: CGPoint(x: (CGFloat(width) - nameSize.width) / 2, y: 42))

            // Dose
            if !dose.isEmpty {
                let doseAttrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 14, weight: .medium),
                    .foregroundColor: UIColor.darkGray
                ]
                let doseStr = NSAttributedString(string: dose, attributes: doseAttrs)
                let doseSize = doseStr.size()
                doseStr.draw(at: CGPoint(x: (CGFloat(width) - doseSize.width) / 2, y: 68))
            }

            // Thin line
            UIColor(white: 0.9, alpha: 1).setStroke()
            let linePath = UIBezierPath()
            linePath.move(to: CGPoint(x: 20, y: 90))
            linePath.addLine(to: CGPoint(x: CGFloat(width) - 20, y: 90))
            linePath.lineWidth = 0.5
            linePath.stroke()

            // Rx symbol
            let rxAttrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 11, weight: .light),
                .foregroundColor: UIColor.lightGray
            ]
            let rxStr = NSAttributedString(string: "Research Use Only", attributes: rxAttrs)
            let rxSize = rxStr.size()
            rxStr.draw(at: CGPoint(x: (CGFloat(width) - rxSize.width) / 2, y: 96))
        }
    }
}

// MARK: - SwiftUI Wrapper for 3D Vial

struct Vial3DView: View {
    let name: String
    let dose: String
    let unit: String
    let fillPercent: Double
    let isDueNow: Bool
    let isRotating: Bool

    @State private var shimmer = false

    var capColor: Color { vialCapColor(for: "", name: name) }

    var body: some View {
        ZStack {
            SceneKitVialView(
                name: name,
                dose: "\(dose)\(unit.isEmpty ? "" : " \(unit)")",
                fillPercent: fillPercent,
                isRotating: isRotating
            )
            .frame(width: 60, height: 90)

            // Glow for due-now
            if isDueNow {
                Circle()
                    .fill(capColor.opacity(shimmer ? 0.3 : 0))
                    .frame(width: 50, height: 50)
                    .blur(radius: 10)
                    .onAppear {
                        withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                            shimmer = true
                        }
                    }
            }
        }
    }
}
