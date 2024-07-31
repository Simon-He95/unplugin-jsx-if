import type { JSXAttribute } from '@babel/types'
import type { ParserOptions } from '@babel/parser'
import { parse } from '@babel/parser'
import { isJSXAttribute, isJSXElement, traverse } from '@babel/types'
import { createUnplugin } from 'unplugin'
import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { PLUGIN_NAME } from './constant'

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => {
  const { prefix = 'v', transformInclude = (id: string) => id.endsWith('.tsx') } = options || {}
  const IF = `${prefix}-if`
  const ELSEIF = new RegExp(`${prefix}-else(?:-if)?$`)
  return [{
    name: PLUGIN_NAME,
    enforce: 'pre',
    transformInclude,
    transform(code: string) {
      try {
        const ast = parserJSX(code) as any
        const updateList: [string, string][] = []
        traverse(ast, {
          enter(node: any, parentNodes: any) {
            if (node.type !== 'JSXElement')
              return
            if (node.openingElement.attributes.length) {
              const vIf = node.openingElement.attributes.find(
                (attr: any) => isJSXAttribute(attr) && attr.name.name === IF,
              ) as JSXAttribute
              if (!vIf || !vIf.value)
                return
              const parentNode = parentNodes.slice(-1)[0]?.node as any
              const siblings = (parentNode).children.filter((i: any) => isJSXElement(i))
              const vIfExpression = code.slice(
                vIf.value.loc!.start.index + 1,
                vIf.value.loc!.end.index - 1,
              )

              const nodeContent = code.slice(node.loc?.start.index, vIf.loc?.start.index) + code.slice(vIf.loc?.end.index, node.loc?.end.index)
              const vIfLists = [[vIfExpression, nodeContent, node]]
              if (!siblings) {
                const replacer = `{${vIfExpression} ? ${nodeContent} : null}`
                updateList.push([nodeContent, replacer])
              }
              else {
                const currentIndex = siblings.findIndex(
                  (sibling: any) => sibling === node,
                )
                const nextSiblings = siblings.slice(currentIndex + 1)
                let nextSibling
                let nextSiblingVElseIf

                // eslint-disable-next-line no-cond-assign
                while ((nextSibling = nextSiblings.splice(0, 1)[0])) {
                  nextSiblingVElseIf
                    = nextSibling.openingElement?.attributes.find(
                      (attr: any) =>
                        isJSXAttribute(attr)
                        && ELSEIF.test(attr.name.name as string),
                    )
                  if (nextSiblingVElseIf) {
                    const vIfExpression = nextSiblingVElseIf.value
                      ? code.slice(
                        nextSiblingVElseIf.value.loc!.start.index + 1,
                        nextSiblingVElseIf.value.loc!.end.index - 1,
                      )
                      : ''
                    const nodeContent = code.slice(nextSibling.loc?.start.index, nextSiblingVElseIf.loc?.start.index) + code.slice(nextSiblingVElseIf.loc?.end.index, nextSibling.loc?.end.index)
                    vIfLists.push([vIfExpression, nodeContent, nextSibling])
                  }
                  else {
                    break
                  }
                }
                // 将第一个开始和最后一个结束转换成 三元表达式
                const [firstExpression, firstNodeContent, firstNode] = vIfLists.shift()!
                // eslint-disable-next-line ts/no-non-null-asserted-optional-chain
                const [_, lastNodeContent, lastNode] = vIfLists?.pop()! || []
                let ternaryExpression = `{${firstExpression} ? ${firstNodeContent}`
                for (const [vIfExpression, nodeContent] of vIfLists)
                  ternaryExpression += ` : ${vIfExpression} ? ${nodeContent}`

                ternaryExpression += ` : ${lastNodeContent || 'null'}}`
                const nodeContent = code
                  .slice(firstNode.loc?.start.index, lastNode ? lastNode.loc.end.index : firstNode.loc?.end.index)
                updateList.push([nodeContent, ternaryExpression])
              }
            }
          },
        })
        return updateList.reduce((result, [origin, replacer]) => result.replace(origin, replacer), code)
      }
      catch (error) {
        console.error(error)
      }
    },
  }]
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

function parserJSX(code: string) {
  const finalOptions: ParserOptions = {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true,
  }
  try {
    return parse(code, finalOptions)
  }
  catch (err) {
    console.error(err)
    return parse('', finalOptions)
  }
}
